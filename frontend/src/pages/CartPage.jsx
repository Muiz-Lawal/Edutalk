import React, { useEffect, useMemo, useState } from 'react';
import { Info, ShoppingCart, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCartStore } from '../stores/cartStore';
import { formatPrice } from '../lib/currency';
import AsyncBoundary, { Skeleton } from '../components/AsyncBoundary';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import '../styles/CartPage.css';

const quickDays = [3, 7, 14, 30];
const getMaxDays = (classData) => classData?.durationType === 'ongoing' ? 30 : Math.min(30, Math.max(0, Number(classData?.daysRemaining || 30)));
const getHost = (classData) => [classData?.hostId?.firstName, classData?.hostId?.lastName].filter(Boolean).join(' ') || 'EduTalk host';

function Thumbnail({ classData }) {
  const [failed, setFailed] = useState(false);
  const letter = classData?.title?.charAt(0)?.toUpperCase() || 'C';
  return <div className={`cart-line__thumbnail ${failed || !classData?.thumbnail ? 'is-fallback' : ''}`}><span>{letter}</span>{classData?.thumbnail && !failed && <img src={classData.thumbnail} alt="" onError={() => setFailed(true)} />}</div>;
}

export default function CartPage() {
  const { lines, updateDays, removeLine } = useCartStore();
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [custom, setCustom] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const results = await Promise.all(lines.map(async (line) => {
          const classResponse = await api.get(`/classes/${line.classId}`);
          const classData = classResponse.data;
          try {
            const quoteResponse = await api.get('/pricing/quote', { params: { classId: line.classId, days: line.days } });
            return [line.classId, { classData, quote: quoteResponse.data }];
          } catch (quoteError) {
            console.error('Failed to quote cart line', quoteError);
            return [line.classId, { classData, lineError: true }];
          }
        }));
        if (!cancelled) setItems(Object.fromEntries(results));
      } catch (requestError) {
        console.error('Failed to load cart lines', requestError);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [lines, reloadKey]);

  const quotedItems = lines.map((line) => ({ line, ...(items[line.classId] || {}) }));
  const totalCents = quotedItems.reduce((sum, item) => sum + Number(item.quote?.totalAmountCents ?? item.quote?.totalCents ?? 0), 0);
  const fullyQuoted = lines.length > 0 && !loading && quotedItems.every((item) => item.classData && item.quote && !item.lineError);
  const retry = () => setReloadKey((key) => key + 1);
  const setDays = (classData, classId, days) => {
    updateDays(classData, days);
    setCustom((current) => ({ ...current, [classId]: !quickDays.includes(Number(days)) }));
  };

  if (!lines.length) return <main className="cart-page"><div className="container cart-empty"><EmptyState icon={ShoppingCart} title="Your cart is empty" description="Add classes from Browse to checkout." action={{ label: 'Browse classes', onClick: () => navigate('/browse') }} /></div></main>;

  return <main className="cart-page"><div className="container"><h1>Your cart</h1>{error && <AsyncBoundary error errorMessage="We couldn’t load your cart" errorDetail="Check your connection and try again." onRetry={retry} onBack={() => navigate('/browse')} />}<div className="cart-layout"><section className="cart-lines">{loading && !Object.keys(items).length ? lines.map((line) => <div className="cart-line-skeleton" key={line.classId}><Skeleton variant="cart" /></div>) : quotedItems.map(({ line, classData, quote, lineError }) => {
    const min = Number(classData?.minPurchaseDays || 1);
    const max = getMaxDays(classData);
    const invalid = classData && (line.days < min || line.days > max);
    const amount = Number(quote?.totalAmountCents ?? quote?.totalCents ?? 0);
    const daily = Number(quote?.dailyRateCents ?? quote?.breakdown?.dailyRateCents ?? 0);
    const isCustom = custom[line.classId] || !quickDays.includes(Number(line.days));
    return <article className="cart-line" key={line.classId}><Thumbnail classData={classData} /><div className="cart-line__meta"><h2>{classData?.title || 'Class unavailable'}</h2><p>by {getHost(classData)}</p>{lineError ? <div className="cart-line__warning">We couldn’t calculate this price. <button type="button" onClick={retry}>Retry</button><button type="button" onClick={() => removeLine(line.classId)}>Remove</button></div> : <><div className="cart-line__controls"><span className="cart-line__selector-label">Days</span>{quickDays.map((days) => <button type="button" key={days} className={Number(line.days) === days && !isCustom ? 'selected' : ''} disabled={days < min || days > max} title={days > max && classData?.durationType === 'fixed' ? `Only ${max} days remain` : undefined} onClick={() => setDays(classData, line.classId, days)}>{days}d</button>)}<button type="button" className={isCustom ? 'selected' : ''} onClick={() => setCustom((current) => ({ ...current, [line.classId]: true }))}>Custom</button>{isCustom && <div className="cart-stepper"><button type="button" onClick={() => setDays(classData, line.classId, Math.max(min, line.days - 1))}>−</button><strong>{line.days}</strong><button type="button" onClick={() => setDays(classData, line.classId, Math.min(max, line.days + 1))}>+</button></div>}</div><p className="cart-line__price">{line.days} {line.days === 1 ? 'day' : 'days'} × {formatPrice(daily)}<strong>{formatPrice(amount)}</strong></p>{invalid && <div className="cart-line__warning">This selection is outside the available range. <button type="button" onClick={() => setDays(classData, line.classId, Math.min(max, Math.max(min, line.days)))}>Fix</button><button type="button" onClick={() => removeLine(line.classId)}>Remove</button></div>}</>}</div><button type="button" className="cart-line__remove" aria-label={`Remove ${classData?.title || 'class'}`} onClick={() => removeLine(line.classId)}><Trash2 size={16} /></button></article>;
  })}</section><aside className="cart-summary"><h2>Order summary</h2><div className="cart-summary__row"><span>Subtotal</span><strong>{formatPrice(totalCents)}</strong></div><div className="cart-summary__row cart-summary__savings"><span>Savings</span><strong>{formatPrice(0)}</strong></div><div className="cart-summary__total"><span>Total</span><strong>{formatPrice(totalCents)}</strong></div><p className="cart-summary__refund"><Info size={15} /> 48-hour full refund guarantee</p><Button className="full-width" disabled={!fullyQuoted || !totalCents} onClick={() => navigate('/checkout/batch')}>{loading ? 'Calculating…' : fullyQuoted && totalCents ? `Pay ${formatPrice(totalCents)}` : 'Pay unavailable'}</Button>{(!fullyQuoted || !totalCents) && <small className="cart-summary__reason">{loading ? 'Calculating…' : 'Add a class to continue'}</small>}</aside></div></div></main>;
}
