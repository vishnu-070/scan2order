import { 
  QrCode, 
  CreditCard, 
  LayoutDashboard, 
  Users, 
  Shield, 
  Zap,
  Store,
  Receipt
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "QR Code Ordering",
    description: "Auto-generated unique QR codes for each table. Customers scan and start ordering instantly.",
  },
  {
    icon: CreditCard,
    title: "Integrated Payments",
    description: "Accept UPI, debit cards, and credit cards. Secure, instant, and hassle-free transactions.",
  },
  {
    icon: Store,
    title: "Multi-Restaurant Support",
    description: "Perfect for restaurant chains. Manage multiple locations from a single dashboard.",
  },
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    description: "Real-time order tracking, menu management, and analytics all in one place.",
  },
  {
    icon: Receipt,
    title: "Order Tracking Codes",
    description: "Every order gets a unique tracking code for easy reference and customer support.",
  },
  {
    icon: Users,
    title: "Easy Onboarding",
    description: "Get your restaurant live in minutes. Simple setup, no technical knowledge required.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption, secure authentication, and complete data isolation.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Menus load in under 2 seconds. Orders appear instantly on your dashboard.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-subtle" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            Features
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="text-gradient">Modernize</span>{" "}
            Your Restaurant
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete platform designed to streamline operations, enhance customer experience, 
            and boost your bottom line.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow duration-300">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
