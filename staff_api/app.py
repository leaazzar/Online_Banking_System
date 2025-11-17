from flask import Flask


def create_app():
    app = Flask(__name__)

    @app.get("/")
    def home():
        return {"service": "staff_api", "status": "running"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=5002, debug=True)
