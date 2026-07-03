export const errorHandler = (err, req, res, next) => {
  console.error(err);
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};
