'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Truck,
  Package,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('Morning (09:00 AM - 01:00 PM)');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('Please call on arrival. Available at home.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rescheduledSuccess, setRescheduledSuccess] = useState<any | null>(null);

  useEffect(() => {
    // Generate tomorrow's date formatted as YYYY-MM-DD as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);

    const fetchOrderByToken = async () => {
      try {
        const res = await fetch(`/api/orders/${token}`);
        if (!res.ok) {
          throw new Error('Reschedule token is invalid or expired.');
        }
        const json = await res.json();
        setOrder(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderByToken();
  }, [token]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/orders/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rescheduleDate: selectedDate,
          rescheduleTimeSlot: selectedSlot,
          deliveryNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to reschedule delivery');
      }

      setRescheduledSuccess(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs space-y-3">
        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-400" />
        <span>Loading secure 1-click reschedule portal...</span>
      </div>
    );
  }

  if (rescheduledSuccess) {
    const updated = rescheduledSuccess.data;
    const assignment = rescheduledSuccess.assignment;

    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Delivery Rescheduled Successfully!</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your shipment <span className="font-mono text-indigo-400 font-bold">{updated.trackingNumber}</span> has been confirmed for the new time slot.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-left">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">New Delivery Date:</span>
              <span className="font-bold text-white font-mono">
                {new Date(updated.rescheduleDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Preferred Slot:</span>
              <span className="font-semibold text-indigo-300">{updated.rescheduleTimeSlot}</span>
            </div>

            {assignment?.assignedAgent && (
              <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">Auto-Reassigned Agent:</span>
                <span className="font-semibold text-emerald-400">{assignment.assignedAgent.name}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/track/${updated.trackingNumber}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>View Live Tracking Timeline</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>ACTION REQUIRED • 1-CLICK RESCHEDULE PORTAL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Reschedule Your Delivery</h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          We missed you on our recent delivery attempt. Pick a convenient date and time window below and our delivery agent will be automatically reassigned.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {order && (
        <form
          onSubmit={handleRescheduleSubmit}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Shipment Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono font-bold text-indigo-400">{order.trackingNumber}</span>
              <span className="text-slate-400 font-medium">To: {order.recipientName}</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-start gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{order.dropAddress} (Pincode: {order.dropPincode})</span>
              </div>
              <div className="text-rose-400 text-[11px] pt-1">
                <strong>Previous Attempt Notice:</strong> {order.failureReason || 'Customer unavailable at delivery location'}
              </div>
            </div>
          </div>

          {/* Date & Time Slot Selectors */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Select New Delivery Date *</span>
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Preferred Delivery Time Window *</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  'Morning (09:00 AM - 01:00 PM)',
                  'Afternoon (01:00 PM - 05:00 PM)',
                  'Evening (05:00 PM - 09:00 PM)',
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      selectedSlot === slot
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {slot.split(' (')[0]}
                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                      ({slot.split(' (')[1]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1.5">
                Delivery Instructions / Alternate Contact (Optional)
              </label>
              <textarea
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Leave with neighbor, call alternative number..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all group"
          >
            {isSubmitting ? (
              <span>Reassigning Nearest Agent & Booking Slot...</span>
            ) : (
              <>
                <span>Confirm Rescheduled Delivery</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
