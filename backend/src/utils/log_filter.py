import logging
from utils.log_sanitizer import sanitize_log_message

class SensitiveDataFilter(logging.Filter):
    """Filter to redact sensitive information from log records."""
    
    def filter(self, record):
        # Sanitize the log message
        if hasattr(record, 'msg'):
            record.msg = sanitize_log_message(record.msg)
        
        # Sanitize the formatted message
        if hasattr(record, 'message'):
            record.message = sanitize_log_message(record.message)
            
        # Sanitize exception info if present
        if record.exc_info:
            try:
                # This is a bit hacky but can help sanitize exceptions
                if hasattr(record.exc_info[1], 'args') and record.exc_info[1].args:
                    args = list(record.exc_info[1].args)
                    for i, arg in enumerate(args):
                        if isinstance(arg, str):
                            args[i] = sanitize_log_message(arg)
                    record.exc_info[1].args = tuple(args)
            except (AttributeError, IndexError):
                # If we can't sanitize the exception, just continue
                pass
        
        # Always allow the record through, but sanitized
        return True