import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Skeleton } from './AsyncBoundary';

const TopClassesTable = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchTopClasses } = useAdmin();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchTopClasses();
        if (response) {
          setClasses(response);
          setError(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchTopClasses]);

  if (loading) return <Skeleton variant="list" />;
  if (error) return <div className="async-state async-state--error" role="alert"><strong>We couldn’t load class performance</strong><p>Please try again.</p></div>;

  return (
    <div className="table-card">
      <h3>Top Classes by Enrollment</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Class Title</th>
            <th>Category</th>
            <th>Instructor</th>
            <th>Students</th>
            <th>Price</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {classes.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                No classes found
              </td>
            </tr>
          ) : (
            classes.map((cls) => (
              <tr key={cls._id}>
                <td>{cls.title}</td>
                <td>{cls.category || 'N/A'}</td>
                <td>{cls.hostName || 'N/A'}</td>
                <td>{cls.totalStudents || 0}</td>
                <td>${(cls.price || 0).toFixed(2)}</td>
                <td>{cls.rating ? cls.rating.toFixed(1) : '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TopClassesTable;
