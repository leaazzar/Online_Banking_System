from flask import Flask
from common.database import Base, engine
from common import models

def create_app():
    app = Flask(__name__)

    Base.metadata.create_all(bind=engine)

    @app.get("/")
    def home():
        return {"service": "auth_service", "status": "running"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=5000, debug=True)
