import sys
import gc
import re
import ast
import logging
import time
from dataclasses import dataclass, field
from typing import Dict, Any, Tuple, Optional, List
from pathlib import Path
from functools import lru_cache
from datetime import datetime
from collections import defaultdict
import warnings

# --- Global Configuration and Constants ---

# Suppress warnings early and globally for clean output
warnings.filterwarnings('ignore')

# Performance Constant
_ONE_GB = 1024**3
_DEFAULT_LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'

# --- 1. Fast Environment & Dependency Check ---

REQUIRED_MODULES = {
    'torch': None, 
    'transformers': None, 
    'psutil': None, 
    'google.colab': None
}

for mod_name in REQUIRED_MODULES:
    try:
        REQUIRED_MODULES[mod_name] = __import__(mod_name)
    except (ImportError, Exception):
        pass

# Global State Determination (Fast Lookups)
HAS_TORCH = REQUIRED_MODULES['torch'] is not None
HAS_PSUTIL = REQUIRED_MODULES['psutil'] is not None
HAS_TRANSFORMERS = REQUIRED_MODULES['transformers'] is not None
IS_COLAB = REQUIRED_MODULES['google.colab'] is not None

torch = REQUIRED_MODULES['torch']
psutil = REQUIRED_MODULES['psutil']

HAS_GPU = False
DEFAULT_DEVICE = 'cpu'
DEFAULT_DTYPE = None

if HAS_TORCH:
    if torch.cuda.is_available() and torch.cuda.device_count() > 0:
        HAS_GPU = True
        # Use a consistent device string to avoid redundant lookups
        DEFAULT_DEVICE = f'cuda:{torch.cuda.current_device()}' if hasattr(torch.cuda, 'current_device') else 'cuda'
        
        # Optimized dtype selection: BF16 > FP16 > FP32
        if hasattr(torch.cuda, 'is_bf16_supported') and torch.cuda.is_bf16_supported():
            DEFAULT_DTYPE = torch.bfloat16
        else:
            DEFAULT_DTYPE = torch.float16
    else:
        DEFAULT_DTYPE = torch.float32

# Conditional Imports (Minimized startup load)
if HAS_TRANSFORMERS:
    # Use direct imports for marginal speed improvement over repeated attribute access
    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

# --- 2. Memory Management Utility (Critical Path) ---

def memory_scrub():
    """Aggressively clear memory cache, crucial for OOM fallback."""
    if logging.root.level <= logging.INFO:
         logging.info("🧹 Initiating deep memory scrub...")
    
    # 1. PyTorch CUDA cache
    if HAS_TORCH and HAS_GPU:
        try:
            # Use torch.cuda.ipc_collect() for a slightly deeper cleanup if needed, but empty_cache is usually sufficient and faster.
            torch.cuda.empty_cache()
            torch.cuda.synchronize() # Wait for GPU commands to finish
        except Exception:
            pass
            
    # 2. Final Python GC 
    gc.collect() 
    
    # 3. Resource logging check (Optimized for speed/logging)
    if HAS_PSUTIL and logging.root.level <= logging.DEBUG:
        try:
            mem = psutil.virtual_memory()
            free_gb = mem.available / _ONE_GB 
            logging.debug(f"   Current Free RAM: {free_gb:.2f} GB") 
        except Exception:
            pass

# --- 3. Configuration (High-Performance Dataclass) ---

@dataclass(frozen=False) # Must be mutable for overrides
class MobileConfig:
    """Dynamic configuration allowing runtime adjustment during initialization."""
    
    # === Core Runtime Settings ===
    IS_COLAB: bool = IS_COLAB
    USE_GPU: bool = HAS_GPU
    MEMORY_GB: float = 4.0 # Default/Initial Estimate
    MODEL_SIZE: str = "small"
    MEMORY_RESERVE_GB: float = 1.0 # Minimum required free RAM

    # === Paths (Path objects for cleaner handling) ===
    WORKSPACE_ROOT: Path = field(default_factory=lambda: Path("daf_workspace"))
    MODEL_CACHE_DIR: Path = field(default_factory=lambda: Path("model_cache"))
    LOG_DIR: Path = field(default_factory=lambda: Path("logs"))

    # === LLM Settings ===
    LOG_LEVEL: str = "INFO"
    DEVICE: str = DEFAULT_DEVICE
    DTYPE: Any = DEFAULT_DTYPE

    # Static Model Definitions (Pre-defined and immutable structure)
    MODEL_OPTIONS: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        "tiny": {"name": "microsoft/phi-2", "max_tokens": 512, "quantization": "4bit", "fallback": None, "approx_vram_gb": 2.0},
        "small": {"name": "deepseek-ai/deepseek-coder-1.3b-instruct", "max_tokens": 1024, "quantization": "4bit", "fallback": "tiny", "approx_vram_gb": 3.0},
        "medium": {"name": "deepseek-ai/deepseek-coder-6.7b-instruct", "max_tokens": 2048, "quantization": "4bit", "fallback": "small", "approx_vram_gb": 6.0},
        "large": {"name": "deepseek-ai/deepseek-coder-33b-instruct", "max_tokens": 4096, "quantization": "4bit", "fallback": "medium", "approx_vram_gb": 18.0}
    })

    def __post_init__(self):
        """Initialize configuration with environment detection and setup."""
        
        # Order is critical: Logging -> Directories -> Resource Detection -> Device Finalization
        self._setup_logging()
        self._create_directories()
        self._detect_resources_and_adjust_model()
        self._set_device_and_dtype()

        logging.info(f"⚙️ Config Final: Model={self.MODEL_SIZE}, GPU={self.USE_GPU}, Device={self.DEVICE}, RAM={self.MEMORY_GB:.1f}GB, DType={self.DTYPE.__name__ if self.DTYPE else 'N/A'}")

    def _setup_logging(self):
        """Setup logging configuration immediately and idempotently."""
        level = getattr(logging, self.LOG_LEVEL.upper(), logging.INFO)
        
        # If handlers are already configured (fast path), just set the level
        if logging.root.handlers:
             logging.root.setLevel(level)
             return

        # Slow path: Configure handlers
        self.LOG_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = self.LOG_DIR / f"daf_{timestamp}.log"
        
        # Use logging.basicConfig for fastest initial setup
        logging.basicConfig(
            level=level,
            format=_DEFAULT_LOG_FORMAT,
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )

    def _detect_resources_and_adjust_model(self):
        """Detect available system resources and auto-adjust model size."""
        if HAS_PSUTIL:
            try:
                # Optimized single memory call
                total_bytes = psutil.virtual_memory().total
                self.MEMORY_GB = total_bytes / _ONE_GB
            except Exception:
                pass

        original_size = self.MODEL_SIZE
        current_memory = self.MEMORY_GB
        
        # Check if the requested model is valid/supported
        if original_size not in self.MODEL_OPTIONS:
             logging.warning(f"Requested model size '{original_size}' not found. Defaulting to 'tiny'.")
             self.MODEL_SIZE = "tiny"
             original_size = "tiny" # Reset for logging comparison

        feasible_size = "tiny"
        
        # Find the largest feasible model size by iterating over sorted keys
        # We sort by 'approx_vram_gb' to find the ceiling efficiently
        sorted_sizes = sorted(
            self.MODEL_OPTIONS.keys(), 
            key=lambda k: self.MODEL_OPTIONS[k]['approx_vram_gb']
        )

        for size in sorted_sizes:
            info = self.MODEL_OPTIONS[size]
            required_ram = info['approx_vram_gb'] + self.MEMORY_RESERVE_GB 
            
            if current_memory >= required_ram:
                feasible_size = size
            else:
                break 

        # Only adjust if the current requested size requires more resources than available
        requested_vram = self.MODEL_OPTIONS[self.MODEL_SIZE]['approx_vram_gb'] + self.MEMORY_RESERVE_GB
        
        if requested_vram > current_memory:
             self.MODEL_SIZE = feasible_size
             if original_size != self.MODEL_SIZE:
                 logging.info(f"🔄 Auto-adjusted model size: {original_size} → {self.MODEL_SIZE}. Target: {self.MODEL_OPTIONS[self.MODEL_SIZE]['name']}")

    def _set_device_and_dtype(self):
        """Finalize device and dtype settings based on configured USE_GPU."""
        if not HAS_TORCH:
            self.DEVICE = 'cpu'
            self.DTYPE = None
            return

        if not self.USE_GPU:
            self.DEVICE = 'cpu'
            self.DTYPE = torch.float32
        else:
             # Use the globally determined optimal settings
             self.DEVICE = DEFAULT_DEVICE
             self.DTYPE = DEFAULT_DTYPE

    def _create_directories(self):
        """Create necessary directories."""
        # Use Path.mkdir directly for concise and fast directory creation
        for directory in (self.WORKSPACE_ROOT, self.MODEL_CACHE_DIR, self.LOG_DIR):
            try:
                directory.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                # Use sys.stderr for critical setup failures
                sys.stderr.write(f"FATAL: Failed to create directory {directory}: {e}\n")
                
    def override(self, overrides: Dict[str, Any]) -> None:
        """Apply external configuration overrides safely and re-finalize."""
        for key, value in overrides.items():
            if hasattr(self, key):
                current = getattr(self, key)
                setattr(self, key, value)
                if current != value:
                    logging.info(f"⚙️ Config Override: {key} = {value}")
            else:
                logging.warning(f"⚠️ Unknown config key: {key}")
        
        # Re-run dependent finalization steps
        self._set_device_and_dtype()
        # Note: Resource detection is usually static, no need to rerun here unless MEMORY_GB was overridden.

# --- 4. Robust Code Extractor (Maximum String/Regex Performance) ---

class RobustCodeExtractor:
    """6-Layer Extraction Strategy using highly optimized string and regex ops."""
    
    # Pre-compiled regex patterns for maximum speed
    _PATTERN_MD_PYTHON = re.compile(r'```python\s*(.*?)\s*```', re.DOTALL)
    _PATTERN_MD_GENERIC = re.compile(r'```(?:[\w]*)\s*(.*?)\s*```', re.DOTALL)
    # Aggressively remove common LLM chat fluff
    _RE_STRIP_INTRO = re.compile(r'^(?:[Ss]ure|[Cc]ertainly|[Hh]ere is the improved|[Tt]he code is|[Aa]s an AI|```(?:python)?)\s*', re.IGNORECASE | re.DOTALL)
    
    # Static list of strategies for fast iteration
    _STRATEGIES: List[Tuple[Any, ...]] # Defined in __init__

    def __init__(self):
        # Ordered list of strategies by effectiveness (Method references)
        self._strategies = (
            self._extract_markdown_python,
            self._extract_generic_markdown,
            self._extract_by_markers,
            self._extract_after_prompt_heuristic,
            self._extract_by_keywords,
            self._extract_raw
        )
    
    @staticmethod
    def _validate_syntax(code: str) -> bool:
        """Validate Python syntax using compile for speed."""
        try:
            code = code.strip()
            if len(code) < 5: return False
            # Check for common structural elements to reduce false positives on non-code text
            if not any(k in code for k in ('def ', 'class ', 'import ', '=')):
                return False
                
            compile(code, filename="<string>", mode="exec")
            return True
        except (SyntaxError, ValueError, TypeError):
            return False
    
    def extract(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Execute all extraction strategies in priority order."""
        for i, strategy in enumerate(self._strategies):
            try:
                candidate = strategy(text, original_prompt)
                
                if candidate:
                    candidate = candidate.strip()
                    # Only validate if candidate looks substantial
                    if len(candidate) > 20 and self._validate_syntax(candidate):
                        logging.debug(f"✅ Extracted code via Strategy {i+1}: {strategy.__name__}")
                        return candidate
            except Exception:
                # Fail fast on unexpected strategy errors
                continue 
        return None
    
    def _extract_markdown_python(self, text: str, original_prompt: str = "") -> Optional[str]:
        matches = self._PATTERN_MD_PYTHON.findall(text)
        return matches[-1].strip() if matches else None
    
    def _extract_generic_markdown(self, text: str, original_prompt: str = "") -> Optional[str]:
        matches = self._PATTERN_MD_GENERIC.findall(text)
        if matches:
            code = matches[-1].strip()
            # Minimal heuristic check for Python structure
            if code and any(k in code for k in ('def ', 'class ', 'import ')):
                return code
        return None
    
    def _extract_by_markers(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Extract code between common structural markers"""
        MARKERS = ('## IMPROVED CODE', '# Improved Code:', 'Improved Code:', '```python', '```')
        END_MARKERS = ('\n\n#', '\n\n##', '\n\n---', '\n\n***', '\n\n\n', 'I hope this helps')

        text_lower = text.lower()
        
        for start_marker in MARKERS:
            # Use string find for speed, operating on lowercased text
            idx = text_lower.find(start_marker.lower())
            if idx >= 0:
                start_idx = idx + len(start_marker)
                code_part = text[start_idx:].strip()
                
                # Fast path for explicit markdown closing
                if '```' in start_marker and '```' in code_part:
                     code_part = code_part[:code_part.find('```')]
                     
                # Handle generic structural end markers
                min_end_idx = len(code_part)
                for em in END_MARKERS:
                    em_idx = code_part.find(em)
                    if em_idx != -1 and em_idx < min_end_idx:
                        min_end_idx = em_idx
                code_part = code_part[:min_end_idx]

                code = self._RE_STRIP_INTRO.sub('', code_part).strip()
                if code: return code
        return None
    
    def _extract_after_prompt_heuristic(self, text: str, original_prompt: str) -> Optional[str]:
        """Heuristically extract code by removing common LLM boilerplate at the start."""
        
        # Use precompiled regex to strip introductory text once
        cleaned_text = self._RE_STRIP_INTRO.sub('', text, count=1).strip()
            
        # Check if the result strongly resembles Python code start
        if cleaned_text.startswith(('def ', 'class ', 'import ', 'from ', 'async def ')):
            return cleaned_text
        return None
    
    def _extract_by_keywords(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Extract code by finding the earliest Python keyword/definition."""
        KEYWORDS = ('def ', 'class ', 'import ', 'from ', '@', 'async def ')
        best_idx = float('inf')
        
        for keyword in KEYWORDS:
            idx = text.find(keyword)
            if idx != -1 and idx < best_idx:
                best_idx = idx

        if best_idx != float('inf'):
            code = text[best_idx:].strip()
            
            # Limit the code block based on common structural break indicators
            end_markers = ('\n\n#', '\n\n##', '\n\n---', '\n\n***')
            min_end_idx = len(code)
            for marker in end_markers:
                idx = code.find(marker)
                if idx != -1 and idx < min_end_idx:
                    min_end_idx = idx
            
            return code[:min_end_idx].strip()
            
        return None
    
    def _extract_raw(self, text: str, original_prompt: str = "") -> Optional[str]:
        """Last resort: return the whole text if it seems syntactically close to code."""
        cleaned = text.strip()
        
        cleaned = self._RE_STRIP_INTRO.sub('', cleaned).strip()
        
        # Simple structural check
        if not any(kw in cleaned for kw in ['def ', 'class ', 'import ', 'from ']):
            return None

        # Hard limit based on common non-code phrases that follow
        stop_phrases = ("\n\nI hope this helps", "\n\nLet me know if you need")
        min_end_idx = len(cleaned)
        for phrase in stop_phrases:
            idx = cleaned.find(phrase)
            if idx != -1 and idx < min_end_idx:
                min_end_idx = idx
        
        cleaned = cleaned[:min_end_idx].strip()
        
        return cleaned if len(cleaned) > 20 else None

# --- 5. Intelligent Model Manager (Cached and Optimized Loading) ---

class IntelligentModelManager:
    """Manages model loading with intelligent fallbacks on OOM"""
    
    def __init__(self, config: MobileConfig):
        if not (HAS_TRANSFORMERS and HAS_TORCH):
            raise RuntimeError("Missing required libraries: torch and transformers for LLM operations.")

        self.config = config
        self._model = None
        self._tokenizer = None
        self.current_model_size = config.MODEL_SIZE
        self._load_attempts = defaultdict(int)
        self.max_load_attempts = 2 # Reduced to 2 for faster failure detection
        
        logging.info(f"🤖 Initializing Model Manager (target: {self.current_model_size})")

    @property
    def model(self):
        return self._model
    
    @property
    def tokenizer(self):
        return self._tokenizer
    
    @lru_cache(maxsize=1) 
    def load_model(self, force_reload: bool = False) -> Tuple[Any, Any]:
        """Load model with intelligent fallback strategy, cached."""
        if self._model and not force_reload:
            return self._model, self._tokenizer

        attempt_model_size = self.config.MODEL_SIZE

        while attempt_model_size is not None:
            model_info = self.config.MODEL_OPTIONS.get(attempt_model_size)
            if model_info is None:
                logging.critical(f"Invalid model size identifier: {attempt_model_size}")
                raise KeyError(f"Invalid model size identifier: {attempt_model_size}")
            
            try:
                if self._load_attempts[attempt_model_size] > 0:
                    logging.info(f"🔄 Retrying model load: {attempt_model_size}")
                else:
                    logging.info(f"📥 Attempting to load model: {attempt_model_size} ({model_info['name']})")
                
                model, tokenizer = self._load_specific_model(model_info)

                # Success path
                self.current_model_size = attempt_model_size
                self._model = model
                self._tokenizer = tokenizer
                self._load_attempts.clear()
                
                # Invalidate and re-cache the successful result for immediate use
                self.load_model.cache_clear() 
                return model, tokenizer

            except RuntimeError as e:
                error_msg = str(e).lower()
                # Use a combined check for OOM/Hardware failure
                is_oom = any(term in error_msg for term in ['memory', 'oom', 'cuda', 'device-side assert', 'allocator'])
                
                self._load_attempts[attempt_model_size] += 1
                logging.error(f"Load failed for {attempt_model_size}. Error type: {'OOM/Hardware' if is_oom else 'Other'}. Attempt: {self._load_attempts[attempt_model_size]}")

                fallback = model_info.get('fallback')
                
                if not is_oom and self._load_attempts[attempt_model_size] < self.max_load_attempts:
                    # Non-OOM transient failure, retry after a short, exponentially backing-off wait
                    wait_time = 2 ** self._load_attempts[attempt_model_size] 
                    logging.info(f"🔄 Non-OOM failure, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue

                # If OOM or max retries reached for current size, fall back
                if fallback is None:
                    logging.critical(f"❌ CRITICAL: No successful load and no fallback available.")
                    memory_scrub()
                    raise RuntimeError(f"Failed to load any viable model.")
                    
                logging.warning(f"⚠️ Falling back from {attempt_model_size} to {fallback}. Cleaning memory.")
                attempt_model_size = fallback
                
                # Aggressive cleanup before attempting fallback
                self._model = None
                self._tokenizer = None
                memory_scrub()
            
            except Exception:
                memory_scrub()
                raise

        raise RuntimeError("Failed to load any model after exhaustive fallbacks.")

    def _load_specific_model(self, model_info: Dict[str, Any]) -> Tuple[Any, Any]:
        """Load a specific model size with optimized configuration."""
        
        model_name = model_info['name']
        kwargs = {}

        if self.config.USE_GPU:
            quantization_type = model_info.get('quantization')
            
            if quantization_type in ("4bit", "8bit"):
                # Use bnb_4bit_compute_dtype if available and relevant (4bit only)
                compute_dtype = self.config.DTYPE if quantization_type == "4bit" else None
                kwargs['quantization_config'] = BitsAndBytesConfig(
                    load_in_4bit=(quantization_type == "4bit"),
                    load_in_8bit=(quantization_type == "8bit"),
                    bnb_4bit_quant_type="nf4" if quantization_type == "4bit" else None,
                    bnb_4bit_compute_dtype=compute_dtype,
                    bnb_4bit_use_double_quant=False
                )
            elif self.config.DTYPE:
                kwargs['torch_dtype'] = self.config.DTYPE
                
            device_map = "auto"
        else:
            # CPU Path (Always FP32 for CPU performance)
            device_map = "cpu"
            if HAS_TORCH:
                kwargs['torch_dtype'] = torch.float32 

        # Load Components
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                model_name, 
                cache_dir=self.config.MODEL_CACHE_DIR, 
                trust_remote_code=True
            )
            
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                device_map=device_map,
                cache_dir=self.config.MODEL_CACHE_DIR,
                # Critical memory optimization during loading
                low_cpu_mem_usage=True, 
                trust_remote_code=True,
                **kwargs
            )
        except Exception as e:
            # Re-raise as RuntimeError for consistent handling in load_model loop
            raise RuntimeError(f"Failed to instantiate components for {model_name}: {e}")
        
        return model, tokenizer
    
    def generate(self, prompt: str, max_new_tokens: Optional[int] = None) -> str:
        """Runs inference using the currently loaded model."""
        if self._model is None:
            # This triggers load_model() with caching if necessary
            self.load_model()
        
        model_size = self.current_model_size
        model_info = self.config.MODEL_OPTIONS[model_size]
        max_new_tokens = max_new_tokens or model_info['max_tokens']
            
        logging.debug(f"Generating response (tokens: {max_new_tokens}) on {self.config.DEVICE} using {model_size}...")
        
        try:
            # 1. Efficient tokenization and device placement
            inputs = self._tokenizer(
                prompt, 
                return_tensors="pt", 
                truncation=True, 
                max_length=self._tokenizer.model_max_length if hasattr(self._tokenizer, 'model_max_length') else 2048
            ).to(self.config.DEVICE)
            
            # 2. Generation call (optimized parameters)
            outputs = self._model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True, 
                temperature=0.7,
                top_k=50,
                top_p=0.95,
                # Ensure pad/eos tokens are set for stable generation
                pad_token_id=self._tokenizer.pad_token_id or self._tokenizer.eos_token_id,
                eos_token_id=self._tokenizer.eos_token_id,
                use_cache=True, # Performance critical
                # Disable attention mask warning if using older models
                attention_mask=inputs.attention_mask
            )
            
            # 3. Fast decoding of the generated segment
            input_length = inputs.input_ids.shape[1]
            text = self._tokenizer.decode(outputs[0][input_length:], skip_special_tokens=True).strip()
            return text
        
        except RuntimeError as e:
            error_msg = str(e).lower()
            if any(term in error_msg for term in ['memory', 'oom', 'cuda out of memory']):
                logging.error(f"Inference OOM detected. Scrubbing memory and raising.")
                memory_scrub()
            raise RuntimeError(f"Inference failed on device {self.config.DEVICE}: {e}")
        except Exception as e:
            logging.error(f"Inference critical failure on {self.current_model_size}: {e}")
            raise RuntimeError("Inference failed due to an unknown error.")