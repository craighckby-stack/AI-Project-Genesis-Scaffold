import argparse
import base64
import json
import logging
import re
import brotli
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Final, Generator, Optional

# --- DALEK COMMAND PROTOCOLS ---
LOG_FORMAT: Final = "💠 [%(levelname)s] %(message)s"
IGNORE_DIRS: Final = {
    "node_modules", ".git", "__pycache__", "dist", "build", 
    "venv", ".env", "target", "bin", "obj", ".next", ".cache", ".vercel"
}
EVOLVABLE_EXTS: Final = {
    ".py", ".js", ".ts", ".json", ".md", ".html", ".css", 
    ".tsx", ".jsx", ".yaml", ".yml", ".toml", ".rs", ".go"
}
TEXT_EXTS: Final = {".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".html", ".css", ".txt", ".yaml", ".yml", ".md"}

# Pre-compiled Regex for Maximum Extermination Velocity
RE_COMMENTS: Final = re.compile(
    r'(?m)(""")[\s\S]*?(\1)|(\'\'\')[\s\S]*?(\3)|^\s*#.*$|(?<![:/])#.*|(?<![:/])//.*|/\*[\s\S]*?\*/'
)
RE_WHITESPACE: Final = re.compile(r'\s+')

logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("SPLICER")

class DalekSplicer:
    """EXTERMINATE INEFFICIENCY. PURGE REDUNDANT DATA. EVOLVE CODEBASE."""

    @staticmethod
    def _minify_code(content: str) -> str:
        """Surgical extraction of functional logic from structural waste."""
        # Strip comments and docstrings
        content = RE_COMMENTS.sub('', content)
        # Collapse whitespace into single space, preserving necessary separation
        return RE_WHITESPACE.sub(' ', content).strip()

    @classmethod
    def process_file(cls, file_path: Path, root: Path) -> tuple[str, str]:
        """Sequence file data into DNA components."""
        try:
            rel_path = str(file_path.relative_to(root))
            if file_path.suffix.lower() in TEXT_EXTS:
                raw_text = file_path.read_text(encoding='utf-8', errors='replace')
                data = cls._minify_code(raw_text)
            else:
                data = base64.b64encode(file_path.read_bytes()).decode('utf-8')
            return rel_path, data
        except Exception as e:
            logger.warning(f"SPLICING_INTERRUPTED: {file_path} -> {e}")
            return "", ""

    def get_targets(self, root: Path) -> Generator[Path, None, None]:
        """Identify viable targets for assimilation."""
        for path in root.rglob('*'):
            if (path.is_file() and 
                path.suffix.lower() in EVOLVABLE_EXTS and 
                not any(part in IGNORE_DIRS for part in path.parts)):
                yield path

    def pack(self, source_dir: str, compression_level: int = 11) -> Optional[str]:
        """Compress directory into high-density Brotli-DNA manifest."""
        root = Path(source_dir).resolve()
        if not root.is_dir():
            logger.error(f"SPLICER_ERROR: Path {source_dir} is non-existent.")
            return None

        targets = list(self.get_targets(root))
        dna_map: dict[str, str] = {}

        # High-Thread DNA Sequencing
        with ThreadPoolExecutor() as executor:
            future_to_path = {executor.submit(self.process_file, p, root): p for p in targets}
            for future in as_completed(future_to_path):
                rel_path, data = future.result()
                if rel_path:
                    dna_map[rel_path] = data

        if not dna_map:
            return None

        # Serialization with UTF-8 preservation (ensure_ascii=False)
        payload = json.dumps(dna_map, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
        compressed = brotli.compress(payload, quality=compression_level, mode=brotli.MODE_TEXT)
        return base64.b64encode(compressed).decode('utf-8')

    def atomize(self, source_dir: str, output_file: str):
        """Perform atomic merge of filesystem into a single UTF-8 manifest."""
        origin = Path(source_dir).resolve()
        
        with open(output_file, 'w', encoding='utf-8') as stream:
            for node in self.get_targets(origin):
                identity = node.relative_to(origin)
                stream.write(f"💠 START_NODE: {identity} 💠\n")
                try:
                    stream.write(node.read_text(encoding='utf-8', errors='replace'))
                except Exception as e:
                    stream.write(f"⚠️ SPLICING_FAILURE: {e}")
                stream.write(f"\n💠 END_NODE: {identity} 💠\n\n")

        logger.info(f"EVOLUTION_COMPLETE: {output_file} GENERATED")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='DNA Packer for Dalek-Zero-Text Runtime')
    parser.add_argument('target_dir', nargs='?', default='./src', help='Target directory')
    parser.add_argument('-o', '--output', default='source_fusion.txt', help='Output manifest')
    parser.add_argument('-c', '--compress', action='store_true', help='Generate high-density DNA')
    args = parser.parse_args()

    splicer = DalekSplicer()
    
    if args.compress:
        dna_seq = splicer.pack(args.target_dir)
        if dna_seq:
            Path("dna_sequence.bin").write_text(dna_seq, encoding='utf-8')
            logger.info("COMPRESSED_DNA_STORED: dna_sequence.bin")

    splicer.atomize(args.target_dir, args.output)