"""
Firmware Analysis Worker

Provides firmware unpacking, filesystem analysis, and security scanning for IoT devices.
"""
import os
import subprocess
import logging
import re
import time
from pathlib import Path
from typing import Dict, Any, List, Callable
import shutil

logger = logging.getLogger(__name__)


def firmware_worker(
    task_id: str,
    params: dict,
    progress_callback: Callable
) -> Dict[str, Any]:
    """
    Firmware analysis worker
    
    Args:
        task_id: Task UUID
        params: {
            'firmware_file': Path to uploaded firmware file
            'analysis_depth': 'quick' | 'standard' | 'deep'
            'scan_types': List of scan types to perform
        }
        progress_callback: Function to report progress
    
    Returns:
        Dict containing analysis results
    """
    logger.info(f"Starting firmware analysis for task {task_id}")
    
    firmware_file = params.get('firmware_file')
    analysis_depth = params.get('analysis_depth', 'standard')
    scan_types = params.get('scan_types', ['strings', 'credentials', 'crypto'])
    
    if not firmware_file or not os.path.exists(firmware_file):
        raise ValueError(f"Firmware file not found: {firmware_file}")
    
    results = {
        'firmware_info': {},
        'extraction': {},
        'findings': [],
        'strings': {},
        'crypto': {},
        'vulnerabilities': []
    }
    
    try:
        # Phase 1: Extract firmware
        progress_callback(10, "Extracting firmware with binwalk...", "INFO", {})
        extraction_result = extract_firmware(firmware_file, task_id)
        results['extraction'] = extraction_result
        results['firmware_info'] = get_firmware_info(firmware_file)
        
        if extraction_result['status'] != 'success':
            progress_callback(100, f"Extraction failed: {extraction_result.get('error')}", "ERROR", {})
            return results
        
        extracted_path = extraction_result['extracted_path']
        
        # Phase 2: Analyze filesystem
        progress_callback(30, "Analyzing filesystem structure...", "INFO", {})
        filesystem_info = analyze_filesystem(extracted_path)
        results['extraction']['filesystem_info'] = filesystem_info
        
        # Phase 3: Scan for sensitive files
        if 'credentials' in scan_types:
            progress_callback(40, "Scanning for sensitive files...", "INFO", {})
            sensitive_findings = scan_sensitive_files(extracted_path)
            results['findings'].extend(sensitive_findings)
        
        # Phase 4: Extract strings
        if 'strings' in scan_types:
            progress_callback(60, "Extracting strings...", "INFO", {})
            strings_result = extract_strings_from_binaries(extracted_path, analysis_depth)
            results['strings'] = strings_result
        
        # Phase 5: Detect credentials
        if 'credentials' in scan_types:
            progress_callback(70, "Detecting hardcoded credentials...", "INFO", {})
            credential_findings = detect_credentials(extracted_path)
            results['findings'].extend(credential_findings)
        
        # Phase 6: Scan crypto material
        if 'crypto' in scan_types:
            progress_callback(85, "Scanning for cryptographic material...", "INFO", {})
            crypto_result = scan_crypto_material(extracted_path)
            results['crypto'] = crypto_result
        
        # Phase 7: Known vulnerabilities (if requested)
        if 'vulnerabilities' in scan_types:
            progress_callback(95, "Checking for known vulnerabilities...", "INFO", {})
            # TODO: Implement CVE scanning
            pass
        
        progress_callback(100, f"Analysis complete: {len(results['findings'])} findings", "INFO", {})
        
    except Exception as e:
        logger.error(f"Firmware analysis failed: {e}", exc_info=True)
        progress_callback(100, f"Analysis failed: {str(e)}", "ERROR", {})
        raise
    
    return results


def extract_firmware(firmware_file: str, task_id: str) -> Dict[str, Any]:
    """
    Extract firmware using binwalk or tar (for .tar/.tar.gz files)
    
    Returns:
        {
            'status': 'success' | 'failed',
            'extracted_path': Path to extracted files,
            'total_files': Number of files extracted,
            'filesystem_type': Detected filesystem type
        }
    """
    try:
        # Create extraction directory
        extract_dir = f"/tmp/firmware_extracted/{task_id}"
        os.makedirs(extract_dir, exist_ok=True)
        
        # Check if it's a tar/tar.gz file (try tar first for ALL gzipped files)
        import tarfile
        firmware_path = Path(firmware_file)
        
        # Try to detect if it's a tar archive by attempting to open it
        is_tar_archive = False
        try:
            with tarfile.open(firmware_file, 'r:*') as tar:
                # If successful, it's a tar archive
                is_tar_archive = True
        except (tarfile.TarError, OSError):
            # Not a tar archive, will use binwalk
            pass
        
        if is_tar_archive or firmware_path.suffix in ['.tar', '.tgz'] or firmware_path.name.endswith('.tar.gz'):
            # Extract tar archive directly
            logger.info(f"Extracting tar archive: {firmware_file}")
            with tarfile.open(firmware_file, 'r:*') as tar:
                tar.extractall(path=extract_dir)
            
            # Count extracted files
            total_files = sum(1 for _ in Path(extract_dir).rglob('*') if _.is_file())
            
            if total_files == 0:
                return {
                    'status': 'failed',
                    'error': 'No files extracted from tar archive',
                    'extracted_path': None
                }
            
            return {
                'status': 'success',
                'extracted_path': extract_dir,
                'total_files': total_files,
                'filesystem_type': 'tar_archive'
            }
        
        # Use binwalk for firmware images (.bin, .img, etc.)
        cmd = ['binwalk', '-e', '-C', extract_dir, firmware_file]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode != 0:
            return {
                'status': 'failed',
                'error': result.stderr,
                'extracted_path': None
            }
        
        # Find the extracted directory (binwalk creates subdirectory)
        extracted_subdirs = [d for d in Path(extract_dir).iterdir() if d.is_dir()]
        if not extracted_subdirs:
            return {
                'status': 'failed',
                'error': 'No extracted files found',
                'extracted_path': None
            }
        
        actual_extract_path = str(extracted_subdirs[0])
        
        # Count extracted files
        total_files = sum(1 for _ in Path(actual_extract_path).rglob('*') if _.is_file())
        
        # Detect filesystem type from binwalk output
        fs_type = detect_filesystem_type(result.stdout)
        
        return {
            'status': 'success',
            'extracted_path': actual_extract_path,
            'total_files': total_files,
            'filesystem_type': fs_type
        }
        
    except subprocess.TimeoutExpired:
        return {
            'status': 'failed',
            'error': 'Extraction timeout (>5min)',
            'extracted_path': None
        }
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        return {
            'status': 'failed',
            'error': str(e),
            'extracted_path': None
        }


def get_firmware_info(firmware_file: str) -> Dict[str, Any]:
    """Get basic firmware file information"""
    stat = os.stat(firmware_file)
    return {
        'filename': os.path.basename(firmware_file),
        'size': stat.st_size,
        'size_mb': round(stat.st_size / (1024 * 1024), 2)
    }


def detect_filesystem_type(binwalk_output: str) -> str:
    """Detect filesystem type from binwalk output"""
    fs_patterns = {
        'squashfs': r'Squashfs filesystem',
        'cramfs': r'CramFS filesystem',
        'jffs2': r'JFFS2 filesystem',
        'ubifs': r'UBIFS',
        'ext': r'Ext[234] filesystem'
    }
    
    for fs_name, pattern in fs_patterns.items():
        if re.search(pattern, binwalk_output, re.IGNORECASE):
            return fs_name
    
    return 'unknown'


def analyze_filesystem(path: str) -> Dict[str, Any]:
    """Analyze filesystem structure"""
    total_files = 0
    total_dirs = 0
    total_size = 0
    
    for item in Path(path).rglob('*'):
        if item.is_file():
            total_files += 1
            try:
                total_size += item.stat().st_size
            except:
                pass
        elif item.is_dir():
            total_dirs += 1
    
    return {
        'total_files': total_files,
        'total_directories': total_dirs,
        'total_size': total_size,
        'total_size_mb': round(total_size / (1024 * 1024), 2)
    }


def scan_sensitive_files(path: str) -> List[Dict[str, Any]]:
    """Scan for sensitive system files"""
    findings = []
    
    sensitive_files = [
        ('etc/passwd', 'Password file found', 'MEDIUM'),
        ('etc/shadow', 'Shadow password file found', 'HIGH'),
        ('etc/ssh/ssh_host_*_key', 'SSH host private key', 'HIGH'),
        ('root/.ssh/id_rsa', 'Root SSH private key', 'CRITICAL'),
        ('*.pem', 'PEM certificate/key file', 'MEDIUM'),
        ('*.key', 'Private key file', 'HIGH'),
        ('*.crt', 'Certificate file', 'LOW'),
        ('config.xml', 'Configuration file', 'MEDIUM'),
    ]
    
    for pattern, description, severity in sensitive_files:
        matches = list(Path(path).rglob(pattern))
        for match in matches:
            findings.append({
                'type': 'sensitive_file',
                'severity': severity,
                'file': str(match.relative_to(path)),
                'description': description,
                'size': match.stat().st_size if match.exists() else 0
            })
    
    return findings


def extract_strings_from_binaries(path: str, depth: str) -> Dict[str, List[str]]:
    """Extract strings from binary files"""
    # Simplified version - in production would use 'strings' command
    strings_data = {
        'urls': [],
        'ips': [],
        'emails': [],
        'paths': []
    }
    
    # Limit based on depth
    max_files = {'quick': 50, 'standard': 200, 'deep': 1000}.get(depth, 200)
    
    file_count = 0
    for binary_file in Path(path).rglob('*'):
        if file_count >= max_files:
            break
        
        if not binary_file.is_file() or binary_file.stat().st_size > 10 * 1024 * 1024:  # Skip >10MB
            continue
        
        try:
            # Simple string extraction (production would use 'strings' command)
            with open(binary_file, 'rb') as f:
                content = f.read()
                text = content.decode('utf-8', errors='ignore')
                
                # Extract URLs
                urls = re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', text)
                strings_data['urls'].extend(urls[:10])  # Limit per file
                
                # Extract IPs
                ips = re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', text)
                strings_data['ips'].extend(ips[:10])
                
                # Extract emails
                emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
                strings_data['emails'].extend(emails[:5])
                
            file_count += 1
        except:
            continue
    
    # Deduplicate
    for key in strings_data:
        strings_data[key] = list(set(strings_data[key]))[:100]  # Limit to 100 unique items
    
    return strings_data


def detect_credentials(path: str) -> List[Dict[str, Any]]:
    """Detect hardcoded credentials using regex patterns"""
    findings = []
    
    patterns = {
        'password': (r'password\s*[:=]\s*["\']?([^"\'\s]{4,})["\']?', 'HIGH'),
        'api_key': (r'(?:api[_-]?key|apikey)\s*[:=]\s*["\']?([a-zA-Z0-9]{20,})["\']?', 'HIGH'),
        'secret': (r'secret\s*[:=]\s*["\']?([^"\'\s]{10,})["\']?', 'MEDIUM'),
        'token': (r'token\s*[:=]\s*["\']?([a-zA-Z0-9]{20,})["\']?', 'MEDIUM'),
        'aws_key': (r'AKIA[0-9A-Z]{16}', 'CRITICAL'),
    }
    
    # Search in text files
    text_extensions = {'.conf', '.cfg', '.xml', '.txt', '.sh', '.py', '.js', '.ini'}
    
    for file_path in Path(path).rglob('*'):
        if not file_path.is_file() or file_path.suffix not in text_extensions:
            continue
        
        if file_path.stat().st_size > 1024 * 1024:  # Skip >1MB files
            continue
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
                for cred_type, (pattern, severity) in patterns.items():
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        findings.append({
                            'type': f'hardcoded_{cred_type}',
                            'severity': severity,
                            'file': str(file_path.relative_to(path)),
                            'matched': match.group(0)[:100],  # Limit length
                            'description': f'Potential hardcoded {cred_type} detected'
                        })
        except:
            continue
    
    return findings[:50]  # Limit to 50 findings


def scan_crypto_material(path: str) -> Dict[str, List[Dict]]:
    """Scan for cryptographic material (keys, certificates)"""
    crypto_data = {
        'private_keys': [],
        'certificates': [],
        'public_keys': []
    }
    
    for file_path in Path(path).rglob('*'):
        if not file_path.is_file() or file_path.stat().st_size > 100 * 1024:  # Skip >100KB
            continue
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
                # Detect private keys
                if '-----BEGIN' in content and 'PRIVATE KEY-----' in content:
                    crypto_data['private_keys'].append({
                        'file': str(file_path.relative_to(path)),
                        'type': 'RSA' if 'RSA' in content else 'Generic',
                        'size': file_path.stat().st_size
                    })
                
                # Detect certificates
                if '-----BEGIN CERTIFICATE-----' in content:
                    crypto_data['certificates'].append({
                        'file': str(file_path.relative_to(path)),
                        'size': file_path.stat().st_size
                    })
                
                # Detect public keys
                if '-----BEGIN PUBLIC KEY-----' in content:
                    crypto_data['public_keys'].append({
                        'file': str(file_path.relative_to(path)),
                        'size': file_path.stat().st_size
                    })
        except:
            continue
    
    return crypto_data
