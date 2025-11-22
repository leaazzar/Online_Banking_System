import os
import sys

# Make sure we can import "common"
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.append(PROJECT_ROOT)

from common.database import engine, Base
import common.models  # import models so they are registered with Base


def main():
    print("Creating all tables in database.db ...")
    Base.metadata.create_all(bind=engine)
    print("Done.")


if __name__ == "__main__":
    main()
