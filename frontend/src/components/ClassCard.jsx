import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ClassCard.css';

export default function ClassCard({ classData }) {
  if (!classData) return null;

  const {
    _id: classId,
    title,
    description,
    category,
    monthlyPrice,
    enrolledStudents,
    rating,
    reviews,
    hostId,
  } = classData;

  const instructor = hostId?.firstName && hostId?.lastName 
    ? `${hostId.firstName} ${hostId.lastName}` 
    : 'Instructor';

  return (
    <Link to={`/classes/${classId}`} className="class-card">
      <div className="class-card__image">
        <div className="class-card__placeholder">
          <div className="class-card__category">{category}</div>
        </div>
      </div>

      <div className="class-card__content">
        <h3 className="class-card__title">{title}</h3>

        <p className="class-card__description">
          {description.substring(0, 100)}...
        </p>

        <div className="class-card__instructor">
          <span className="class-card__instructor-name">by {instructor}</span>
        </div>

        <div className="class-card__footer">
          <div className="class-card__info">
            <span className="class-card__price">${monthlyPrice}/month</span>
            <span className="class-card__students">{enrolledStudents} students</span>
          </div>

          <div className="class-card__rating">
            {rating > 0 && (
              <>
                <span className="class-card__stars">
                  {'⭐'.repeat(Math.round(rating))}
                </span>
                <span className="class-card__reviews">({reviews})</span>
              </>
            )}
            {rating === 0 && <span className="class-card__new">New</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
