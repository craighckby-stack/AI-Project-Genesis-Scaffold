import os
import brotli
import base64
import struct
import re
import concurrent.futures
import logging
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# BRAIN-FIREBASE-RUNTIME: DNA PACKER (Phase 2.3)
# Enhanced for efficiency, robustness, and maintainability.

class CodePacker:
    def __init__(self, 
                 output_file: str = 'brain_dna_payload.txt', 
                 evolvable_extensions: Optional[List[str]] = None,
                 minify: bool = True,
                 compression_level: int = 11,
                 max_workers: Optional[int] = None,
                 chunk_size: int = 1024 * 1024):
        """Initialize the CodePacker with configurable options.
        
        Args:
            output_file: Path to save the packed payload
            evolvable_extensions: List of file extensions to process
            minify: Whether to minify code before packing
            compression_level: Brotli compression level (0-11)
            max_workers: Maximum number of worker threads for parallel processing
            chunk_size: Size of chunks to process for large files
        """
        self.output_file = output_file
        self.evolvable_extensions = evolvable_extensions or ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
        self.minify = minify
        self.compression_level = compression_level
        self.max_workers = max_workers or os.cpu_count() or 1
        self.chunk_size = chunk_size
        
        # Validate compression level
        if not 0 <= self.compression_level <= 11:
            logger.warning(f"Invalid compression level {compression_level}. Using default 11.")
            self.compression_level = 11
    
    def minify_code(self, code: str) -> str:
        """Minify code by removing comments, whitespace, and optimizing syntax."""
        try:
            # Remove multi-line comments
            code = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', code)
            # Remove single-line comments
            code = re.sub(r'//.*', '', code)
            # Remove whitespace around operators
            code = re.sub(r'\s*([=+\-*/%&|^~<>!?:;,{}()\[\]])\s*', r'\1', code)
            # Collapse multiple whitespace
            code = re.sub(r'\s+', ' ', code)
            # Remove unnecessary spaces
            code = re.sub(r'\s*([,;:])\s*', r'\1', code)
            return code.strip()
        except Exception as e:
            logger.warning(f"Minification failed: {e}")
            return code
    
    def should_skip_file(self, rel_path: str) -> bool:
        """Determine if a file should be skipped based on path."""
        path_parts = rel_path.split(os.sep)
        
        # Skip hidden files and directories
        if any(part.startswith('.') for part in path_parts):
            return True
        
        # Skip common directories
        skip_dirs = {'node_modules', 'dist', 'build', '.git', '.next', '.cache'}
        if any(part in skip_dirs for part in path_parts):
            return True
            
        # Skip files that are too large
        full_path = os.path.join(os.getcwd(), rel_path)
        try:
            file_size = os.path.getsize(full_path)
            if file_size > 10 * 1024 * 1024:  # 10MB limit
                logger.warning(f"Skipping large file: {rel_path} ({file_size / (1024*1024):.2f} MB)")
                return True
        except OSError:
            return True
            
        return False
    
    def process_file_chunk(self, full_path: str, rel_path: str) -> Optional[bytes]:
        """Process a chunk of a file and return packed binary data."""
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read(self.chunk_size)
                
                if not content:  # EOF
                    return None
                
                if self.minify:
                    content = self.minify_code(content)
                
                path_bytes = rel_path.encode('utf-8')
                content_bytes = content.encode('utf-8')
                
                # Pack: [pathLen 2B][contentLen 4B][path][content] (Little Endian)
                header = struct.pack('<HI', len(path_bytes), len(content_bytes))
                return header + path_bytes + content_bytes
                
        except UnicodeDecodeError:
            logger.warning(f"Skipping {rel_path}: Could not decode file as UTF-8")
        except IOError as e:
            logger.warning(f"Skipping {rel_path}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error processing {rel_path}: {e}")
        
        return None
    
    def process_file(self, full_path: str, rel_path: str) -> Optional[bytes]:
        """Process a single file and return packed binary data."""
        if self.should_skip_file(rel_path):
            return None
            
        try:
            # Check if file is large enough to need chunking
            file_size = os.path.getsize(full_path)
            if file_size > self.chunk_size:
                logger.info(f"Processing large file {rel_path} in chunks")
                
                binary_data = bytearray()
                chunk_count = 0
                
                with open(full_path, 'r', encoding='utf-8') as f:
                    while True:
                        chunk_data = self.process_file_chunk(full_path, rel_path)
                        if chunk_data:
                            binary_data.extend(chunk_data)
                            chunk_count += 1
                        else:
                            break
                            
                logger.info(f"Processed {rel_path} in {chunk_count} chunks")
                return bytes(binary_data)
            else:
                return self.process_file_chunk(full_path, rel_path)
                
        except Exception as e:
            logger.error(f"Error processing file {rel_path}: {e}")
            return None
    
    def process_files_parallel(self, file_paths: List[Tuple[str, str]]) -> bytearray:
        """Process multiple files in parallel for better performance."""
        binary_data = bytearray()
        processed_count = 0
        skipped_count = 0
        error_count = 0
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_path = {executor.submit(self.process_file, full_path, rel_path): (full_path, rel_path)
                             for full_path, rel_path in file_paths}
            
            for future in concurrent.futures.as_completed(future_to_path):
                full_path, rel_path = future_to_path[future]
                try:
                    result = future.result()
                    if result:
                        binary_data.extend(result)
                        processed_count += 1
                    else:
                        skipped_count += 1
                except Exception as e:
                    logger.error(f"Error processing {rel_path}: {e}")
                    error_count += 1
        
        logger.info(f"Processing complete: {processed_count} files processed, "
                   f"{skipped_count} skipped, {error_count} errors")
        return binary_data
    
    def pack_directory(self, dir_path: str) -> bool:
        """Pack all relevant files in a directory into a compressed payload."""
        start_time = time.time()
        dir_path = Path(dir_path).resolve()
        
        if not dir_path.is_dir():
            logger.error(f"Directory '{dir_path}' does not exist")
            return False
        
        logger.info(f"Scanning {dir_path}...")
        
        # Collect all files to process
        file_paths = []
        file_count = 0
        
        for root, dirs, files in os.walk(dir_path):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                if not any(file.endswith(ext) for ext in self.evolvable_extensions):
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, dir_path)
                file_paths.append((full_path, rel_path))
                file_count += 1
        
        if file_count == 0:
            logger.warning("No evolvable files found to pack")
            return False
        
        logger.info(f"Found {file_count} files to process. Starting parallel processing...")
        
        # Process files in parallel
        binary_data = self.process_files_parallel(file_paths)
        
        if not binary_data:
            logger.error("No data was successfully processed")
            return False
        
        logger.info(f"Processed {len(binary_data)} bytes of data. Compressing with Brotli...")
        
        try:
            # Compress with Brotli
            compressed = brotli.compress(binary_data, quality=self.compression_level)
            base64_string = base64.b64encode(compressed).decode('utf-8')
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            logger.info(f"Compression complete. Processing time: {processing_time:.2f} seconds")
            logger.info(f"Original size: {len(binary_data)} bytes")
            logger.info(f"Compressed size: {len(compressed)} bytes")
            logger.info(f"Base64 length: {len(base64_string)}")
            logger.info(f"Compression ratio: {len(compressed) / len(binary_data) * 100:.2f}%")
            
            # Write output file
            output_path = Path(self.output_file).resolve()
            with open(output_path, 'w') as f:
                f.write(base64_string)
            
            logger.info(f"Payload saved to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error during compression: {e}")
            return False

if __name__ == "__main__":
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description='Pack code files into a compressed payload.')
    parser.add_argument('directory', nargs='?', default='./src', help='Directory to pack (default: ./src)')
    parser.add_argument('--output', '-o', default='brain_dna_payload.txt', help='Output file path')
    parser.add_argument('--no-minify', action='store_true', help='Disable code minification')
    parser.add_argument('--compression-level', type=int, default=11, choices=range(12), 
                        help='Brotli compression level (0-11, default: 11)')
    parser.add_argument('--workers', type=int, default=None, 
                        help='Number of worker threads (default: CPU count)')
    
    args = parser.parse_args()
    
    packer = CodePacker(
        output_file=args.output,
        minify=not args.no_minify,
        compression_level=args.compression_level,
        max_workers=args.workers
    )
    
    success = packer.pack_directory(args.directory)
    
    if not success:
        sys.exit(1)