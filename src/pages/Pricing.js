import React from 'react';

const Pricing = ({ user }) => {
  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Choose Your Plan</h1>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Free Plan */}
        <div style={{
          flex: '1',
          minWidth: '280px',
          maxWidth: '320px',
          border: user?.plan === 'free' ? '2px solid #4f46e5' : '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: user?.plan === 'free' ? '#f0f4ff' : 'white',
          boxShadow: user?.plan === 'free' ? '0 4px 6px rgba(79, 70, 229, 0.1)' : 'none'
        }}>
          <h2 style={{ color: '#4f46e5', marginBottom: '1.5rem' }}>Free Plan</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0', color: '#1f2937' }}>
            Rs 0
          </div>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>per month</p>
          <ul style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <li style={{ marginBottom: '0.75rem' }}>✅ 3 uploads (lifetime)</li>
            <li style={{ marginBottom: '0.75rem' }}>✅ 50 flashcards (lifetime)</li>
          </ul>
          <button
            style={{
              backgroundColor: user?.plan === 'free' ? '#4f46e5' : '#e5e7eb',
              color: user?.plan === 'free' ? 'white' : '#6b7280',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: user?.plan === 'free' ? 'pointer' : 'not-allowed'
            }}
            disabled={user?.plan === 'free'}
          >
            {user?.plan === 'free' ? 'Current Plan' : 'Select Plan'}
          </button>
        </div>

        {/* Premium Plan */}
        <div style={{
          flex: '1',
          minWidth: '280px',
          maxWidth: '320px',
          border: user?.plan === 'premium' ? '2px solid #10b981' : '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: user?.plan === 'premium' ? '#f0fdf4' : 'white',
          boxShadow: user?.plan === 'premium' ? '0 4px 6px rgba(16, 185, 129, 0.1)' : 'none'
        }}>
          <h2 style={{ color: '#10b981', marginBottom: '1.5rem' }}>Premium Plan</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              Rs 400/month
            </div>
            <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>
              (billed annually)
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#dc2626', marginTop: '0.5rem' }}>
              Rs 600/month
            </div>
            <div style={{ fontSize: '1rem', color: '#6b7280' }}>
              (billed monthly)
            </div>
          </div>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>per month</p>
          <ul style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <li style={{ marginBottom: '0.75rem' }}>✅ Unlimited uploads</li>
            <li style={{ marginBottom: '0.75rem' }}>✅ Unlimited flashcards</li>
          </ul>
          <button
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {user?.plan === 'premium' ? 'Current Plan' : 'Upgrade Now'}
          </button>
        </div>
      </div>

      {/* Payment Instructions */}
      <div style={{
        marginTop: '3rem',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#374151' }}>Payment Instructions</h2>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#6b7280' }}>
          To upgrade to Premium, please make payment using the details below and send proof of payment to hamza.nasir0603@gmail.com
        </p>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>Payment Method:</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>Account Title:</label>
                <input
                  type="text"
                  value="Hamza Nasir"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: '#f9fafb',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>BAFL Account Number:</label>
                <input
                  type="text"
                  value="06701008967851"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: '#f9fafb',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>
          </div>
          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontStyle: 'italic',
            color: '#6b7280',
            fontSize: '0.9rem'
          }}>
            After payment, send proof of payment to get upgraded to Premium plan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;