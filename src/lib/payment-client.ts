"use client";

export type PaymentProviderType = "paystack" | "flutterwave" | "monnify";

interface InlinePaymentOptions {
  orderId: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  reference: string;
  accessCode?: string;
  authorizationUrl?: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

/**
 * Service to handle inline and redirect payment flows for different providers.
 * Makes the multi-provider payment logic DRY and maintainable.
 */
export class PaymentClientService {
  /**
   * Loads the appropriate inline script for a provider if not already present
   */
  static async loadProviderScript(
    provider: PaymentProviderType,
  ): Promise<void> {
    const scripts: Record<PaymentProviderType, string> = {
      paystack: "https://js.paystack.co/v1/inline.js",
      flutterwave: "https://checkout.flutterwave.com/v3.js",
      monnify: "https://sdk.monnify.com/plugin/monnify.js",
    };

    const src = scripts[provider];
    if (!src) return;

    if (typeof document === "undefined") return;
    if (document.querySelector(`script[src="${src}"]`)) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error(`Failed to load ${provider} script`));
      document.body.appendChild(script);
    });
  }

  /**
   * Initialises the payment flow based on the chosen provider and available data
   */
  static async processPayment(
    provider: PaymentProviderType,
    options: InlinePaymentOptions,
  ): Promise<void> {
    switch (provider) {
      case "paystack":
        return this.handlePaystack(options);
      case "monnify":
        return this.handleMonnify(options);
      case "flutterwave":
        return this.handleFlutterwave(options);
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  private static handlePaystack(options: InlinePaymentOptions) {
    if ((window as any).PaystackPop && options.accessCode) {
      const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        access_code: options.accessCode,
        onClose: () => options.onCancel(),
        callback: (response: any) =>
          options.onSuccess(response.reference || options.reference),
      });
      handler.openIframe();
      return;
    }

    if (options.authorizationUrl) {
      window.location.href = options.authorizationUrl;
      return;
    }

    throw new Error(
      "Paystack SDK not loaded or missing access code, and no authorization URL provided",
    );
  }

  private static handleMonnify(options: InlinePaymentOptions) {
    if ((window as any).MonnifySDK) {
      (window as any).MonnifySDK.initialize({
        amount: options.amount,
        currency: options.currency || "NGN",
        reference: options.reference,
        customerName: options.name || "Customer",
        customerEmail: options.email,
        apiKey: process.env.NEXT_PUBLIC_MONNIFY_API_KEY,
        contractCode: process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE,
        paymentDescription: `Order #${options.orderId.slice(0, 8)}`,
        onComplete: (response: any) => options.onSuccess(options.reference),
        onClose: () => options.onCancel(),
      });
      return;
    }

    // Fallback to redirect
    if (options.authorizationUrl) {
      window.location.href = options.authorizationUrl;
      return;
    }

    throw new Error("Monnify SDK not loaded and no authorization URL provided");
  }

  private static handleFlutterwave(options: InlinePaymentOptions) {
    if ((window as any).FlutterwaveCheckout) {
      (window as any).FlutterwaveCheckout({
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: options.reference,
        amount: options.amount,
        currency: options.currency || "NGN",
        customer: {
          email: options.email,
          name: options.name,
        },
        callback: (data: any) =>
          options.onSuccess(data.tx_ref || options.reference),
        onclose: () => options.onCancel(),
      });
      return;
    }

    if (options.authorizationUrl) {
      window.location.href = options.authorizationUrl;
      return;
    }

    throw new Error(
      "Flutterwave SDK not loaded and no authorization URL provided",
    );
  }
}
