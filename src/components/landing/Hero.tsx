import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode, Smartphone, CreditCard } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              QR-Based Ordering Made Simple
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-up delay-100">
              Transform Your{" "}
              <span className="text-gradient">Restaurant</span>{" "}
              Experience
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-up delay-200">
              Enable seamless dine-in ordering with QR codes. No apps, no waiting. 
              Customers scan, order, and pay – all from their phone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up delay-300">
              <Button variant="hero" size="lg" className="group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="hero-outline" size="lg">
                Watch Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border animate-fade-up delay-400">
              <div>
                <div className="font-display text-2xl sm:text-3xl font-bold">500+</div>
                <div className="text-sm text-muted-foreground">Restaurants</div>
              </div>
              <div>
                <div className="font-display text-2xl sm:text-3xl font-bold">2M+</div>
                <div className="text-sm text-muted-foreground">Orders Served</div>
              </div>
              <div>
                <div className="font-display text-2xl sm:text-3xl font-bold">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
          
          {/* Visual */}
          <div className="relative lg:pl-8 animate-fade-up delay-300">
            <div className="relative">
              {/* Main Card */}
              <div className="relative bg-gradient-card rounded-3xl p-8 shadow-lg border border-border/50 animate-float">
                {/* Phone Mockup */}
                <div className="bg-foreground rounded-[2rem] p-2 shadow-2xl max-w-[280px] mx-auto">
                  <div className="bg-background rounded-[1.75rem] overflow-hidden">
                    {/* Status Bar */}
                    <div className="h-8 bg-muted flex items-center justify-center">
                      <div className="w-20 h-1 bg-foreground/20 rounded-full" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 space-y-4">
                      <div className="text-center pb-4 border-b border-border">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-hero mx-auto mb-3 flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div className="font-display font-semibold">Table 12</div>
                        <div className="text-xs text-muted-foreground">The Golden Fork</div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="space-y-3">
                        {[
                          { name: "Margherita Pizza", price: "₹350" },
                          { name: "Garlic Bread", price: "₹120" },
                          { name: "Pasta Alfredo", price: "₹280" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm font-bold text-primary">{item.price}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total */}
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-medium">Total</span>
                          <span className="font-display font-bold text-lg">₹750</span>
                        </div>
                        <div className="h-11 bg-gradient-hero rounded-xl flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          Pay Now
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 bg-background rounded-2xl p-4 shadow-card border border-border animate-fade-in delay-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">No App</div>
                    <div className="font-semibold text-sm">Required</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-background rounded-2xl p-4 shadow-card border border-border animate-fade-in delay-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Instant</div>
                    <div className="font-semibold text-sm">Payments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
