import logging


def configure_logging() -> logging.Logger:
    """Configure base logging format and return the root logger for the app."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
    return logging.getLogger("stadium-genie")
