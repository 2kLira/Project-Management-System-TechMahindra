function errorHandler(err, req, res, next) {
    console.error(`[${req.method}] ${req.path} →`, err.message);

    const status = err.status || 500;
    const message = status === 500 ? 'Internal server error' : err.message;

    res.status(status).json({ message });
}

module.exports = { errorHandler };
