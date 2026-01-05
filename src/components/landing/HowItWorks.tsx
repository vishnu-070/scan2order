import { ScanLine, UtensilsCrossed, CreditCard, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: ScanLine,
    number: "01",
    title: "Scan QR Code",
    description: "Customer scans the unique QR code placed on their table using their smartphone camera.",
  },
  {
    icon: UtensilsCrossed,
    number: "02",
    title: "Browse & Order",
    description: "The digital menu loads instantly. Customers can browse items and add them to their cart.",
  },
  {
    icon: CreditCard,
    number: "03",
    title: "Pay Online",
    description: "Secure payment via UPI, debit card, or credit card. No cash handling required.",
  },
  {
    icon: CheckCircle2,
    number: "04",
    title: "Order Confirmed",
    description: "Order appears on your dashboard with a unique tracking code. Kitchen gets notified instantly.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-medium text-sm mb-6">
            How It Works
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Four Simple Steps to{" "}
            <span className="text-gradient">Seamless</span>{" "}
            Ordering
          </h2>
          <p className="text-lg text-muted-foreground">
            From scan to serve, the entire process takes less than 2 minutes.
          </p>
        </div>
        
        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group"
              >
                {/* Card */}
                <div className="relative bg-gradient-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 h-full">
                  {/* Number Badge */}
                  <div className="absolute -top-4 left-6 px-3 py-1 bg-gradient-hero rounded-full text-primary-foreground font-display font-bold text-sm">
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-background border border-border flex items-center justify-center mb-4 mt-2 group-hover:border-primary/30 transition-colors">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  
                  <h3 className="font-display font-semibold text-xl mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 bg-background border border-border rounded-full -translate-y-1/2 z-10 flex items-center justify-center">
                    <div className="w-2 h-2 border-t-2 border-r-2 border-primary rotate-45" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
