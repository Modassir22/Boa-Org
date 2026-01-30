import { toast } from 'sonner';

import { API_BASE_URL } from './utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  config?: {
    display?: {
      blocks?: Record<string, any>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderResponse {
  success: boolean;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
  key_id: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  registration_data: any;
  payment_type: 'seminar' | 'membership';
}

class RazorpayService {
  private isScriptLoaded = false;

  // Load Razorpay script
  async loadRazorpayScript(): Promise<boolean> {
    if (this.isScriptLoaded) {
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  // Test backend connection
  async testConnection(): Promise<void> {
    try {
      console.log('Testing backend connection...');
      const response = await fetch(`${API_BASE_URL}/api/payment/test-connection`, {
        method: 'GET'
      });

      console.log('Test response status:', response.status);
      const data = await response.json();
      console.log('Test response data:', data);
    } catch (error) {
      console.error('Test connection error:', error);
    }
  }

  // Create Razorpay order
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      console.log('Frontend: Creating order with data:', orderData);
      
      const requestBody = JSON.stringify(orderData);
      console.log('Frontend: Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      console.log('Frontend: Response status:', response.status);
      console.log('Frontend: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Frontend: Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Frontend: Response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      return data;
    } catch (error: any) {
      console.error('Create order error:', error);
      throw new Error(error.message || 'Failed to create payment order');
    }
  }

  // Verify payment
  async verifyPayment(paymentData: VerifyPaymentRequest): Promise<any> {
    try {
      console.log('=== FRONTEND VERIFY PAYMENT ===');
      console.log('Payment data:', paymentData);
      
      const requestBody = JSON.stringify(paymentData);
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/api/payment/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      console.log('Verify response status:', response.status);
      console.log('Verify response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Verify error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Verify response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Payment verification failed');
      }

      return data;
    } catch (error: any) {
      console.error('Verify payment error:', error);
      throw new Error(error.message || 'Payment verification failed');
    }
  }

  // Open Razorpay checkout
  async openCheckout(options: RazorpayOptions): Promise<void> {
    const isLoaded = await this.loadRazorpayScript();
    
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay. Please check your internet connection.');
    }

    if (!window.Razorpay) {
      throw new Error('Razorpay is not available');
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }

  // Process seminar registration payment
  async processSeminarPayment(
    amount: number,
    registrationData: any,
    userDetails: { name: string; email: string; mobile: string }
  ): Promise<any> {
    try {
      console.log('=== RAZORPAY PROCESS SEMINAR PAYMENT ===');
      console.log('Amount:', amount, 'Type:', typeof amount);
      console.log('Registration data:', registrationData);
      console.log('User details:', userDetails);

      // Validate amount
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error(`Invalid amount: ${amount} (type: ${typeof amount})`);
      }

      // Create order
      const orderResponse = await this.createOrder({
        amount,
        receipt: `seminar_${Date.now()}`,
        metadata: {
          type: 'seminar',
          seminar_id: registrationData.seminar_id,
          user_id: registrationData.user_id
        }
      });

      // Open Razorpay checkout
      return new Promise((resolve, reject) => {
        const options: RazorpayOptions = {
          key: orderResponse.key_id,
          amount: orderResponse.order.amount,
          currency: orderResponse.order.currency,
          name: 'Bihar Ophthalmic Association',
          description: 'Seminar Registration Fee',
          order_id: orderResponse.order.id,
          handler: async (response: RazorpayResponse) => {
            try {
              // Verify payment
              const verificationResult = await this.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registration_data: {
                  ...registrationData,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id
                },
                payment_type: 'seminar'
              });

              resolve(verificationResult);
            } catch (error) {
              reject(error);
            }
          },
          prefill: {
            name: userDetails.name,
            email: userDetails.email,
            contact: userDetails.mobile
          },
          config: {
            display: {
              blocks: {
                banks: {
                  name: 'Pay using Netbanking',
                  instruments: [
                    {
                      method: 'netbanking'
                    }
                  ]
                },
                card: {
                  name: 'Pay using Cards',
                  instruments: [
                    {
                      method: 'card'
                    }
                  ]
                },
                upi: {
                  name: 'Pay using UPI',
                  instruments: [
                    {
                      method: 'upi'
                    }
                  ]
                },
                wallet: {
                  name: 'Pay using Wallets',
                  instruments: [
                    {
                      method: 'wallet'
                    }
                  ]
                }
              },
              sequence: ['block.upi', 'block.card', 'block.banks', 'block.wallet'],
              preferences: {
                show_default_blocks: true
              }
            }
          },
          theme: {
            color: '#0B3C5D'
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment cancelled by user'));
            }
          }
        };

        this.openCheckout(options).catch(reject);
      });
    } catch (error) {
      console.error('Process seminar payment error:', error);
      throw error;
    }
  }

  // Process membership payment
  async processMembershipPayment(
    amount: number,
    membershipData: any
  ): Promise<any> {
    try {
      // Create order
      const orderResponse = await this.createOrder({
        amount,
        receipt: `membership_${Date.now()}`,
        metadata: {
          type: 'membership',
          membership_type: membershipData.membership_type
        }
      });

      // Open Razorpay checkout
      return new Promise((resolve, reject) => {
        const options: RazorpayOptions = {
          key: orderResponse.key_id,
          amount: orderResponse.order.amount,
          currency: orderResponse.order.currency,
          name: 'Bihar Ophthalmic Association',
          description: 'Membership Registration Fee',
          order_id: orderResponse.order.id,
          handler: async (response: RazorpayResponse) => {
            try {
              // Verify payment
              const verificationResult = await this.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registration_data: membershipData,
                payment_type: 'membership'
              });

              resolve(verificationResult);
            } catch (error) {
              reject(error);
            }
          },
          prefill: {
            name: membershipData.name,
            email: membershipData.email,
            contact: membershipData.mobile
          },
          config: {
            display: {
              blocks: {
                banks: {
                  name: 'Pay using Netbanking',
                  instruments: [
                    {
                      method: 'netbanking'
                    }
                  ]
                },
                card: {
                  name: 'Pay using Cards',
                  instruments: [
                    {
                      method: 'card'
                    }
                  ]
                },
                upi: {
                  name: 'Pay using UPI',
                  instruments: [
                    {
                      method: 'upi'
                    }
                  ]
                },
                wallet: {
                  name: 'Pay using Wallets',
                  instruments: [
                    {
                      method: 'wallet'
                    }
                  ]
                }
              },
              sequence: ['block.upi', 'block.card', 'block.banks', 'block.wallet'],
              preferences: {
                show_default_blocks: true
              }
            }
          },
          theme: {
            color: '#0B3C5D'
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment cancelled by user'));
            }
          }
        };

        this.openCheckout(options).catch(reject);
      });
    } catch (error) {
      console.error('Process membership payment error:', error);
      throw error;
    }
  }
}

export const razorpayService = new RazorpayService();