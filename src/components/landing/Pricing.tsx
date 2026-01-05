import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small restaurants getting started",
    price: {
      monthly: "₹999",
      yearly: "₹799",
    },
    period: "/month",
    features: [
      "Up to 10 tables",
      "Basic menu management",
      "QR code generation",
      "Online payments (UPI, Cards)",
      "Order tracking codes",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing restaurants with more needs",
    price: {
      monthly: "₹2,499",
      yearly: "₹1,999",
    },
    period: "/month",
    features: [
      "Up to 50 tables",
      "Advanced menu with categories",
      "Custom QR designs",
      "Priority payment processing",
      "Real-time analytics",
      "Priority support",
      "Multi-user access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For restaurant chains and large venues",
    price: {
      monthly: "₹5,999",
      yearly: "₹4,999",
    },
    period: "/month",
    features: [
      "Unlimited tables",
      "Multi-restaurant support",
      "White-label branding",
      "API access",
      "Dedicated account manager",
      "24/7 phone support",
      "Custom integrations",
      "SLA guarantee",
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-subtle" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            Pricing
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Simple,{" "}
            <span className="text-gradient">Transparent</span>{" "}
            Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your restaurant. All plans include a 14-day free trial.
          </p>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? "bg-foreground text-background scale-105 shadow-lg"
                  : "bg-background border border-border hover:border-primary/30 hover:shadow-card"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-hero rounded-full text-primary-foreground font-semibold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              )}
              
              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="font-display font-bold text-2xl mb-2">
                  {plan.name}
                </h3>
                <p className={plan.popular ? "text-background/70" : "text-muted-foreground"}>
                  {plan.description}
                </p>
              </div>
              
              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">
                    {plan.price.yearly}
                  </span>
                  <span className={plan.popular ? "text-background/70" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${plan.popular ? "text-background/60" : "text-muted-foreground"}`}>
                  Billed yearly (save 20%)
                </p>
              </div>
              
              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.popular ? "bg-primary" : "bg-primary/10"
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                    </div>
                    <span className={plan.popular ? "text-background/90" : "text-foreground"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : "outline"}
                size="lg"
                className={`w-full ${plan.popular ? "bg-background text-foreground hover:bg-background/90" : ""}`}
              >
                Start Free Trial
              </Button>
            </div>
          ))}
        </div>
        
        {/* Bottom Note */}
        <p className="text-center text-muted-foreground mt-12">
          All prices are in INR. GST applicable. Cancel anytime.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
