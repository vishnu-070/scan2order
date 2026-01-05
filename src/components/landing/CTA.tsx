import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 sm:p-12 lg:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary rounded-full blur-3xl" />
          </div>
          
          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-background mb-6">
                Ready to Transform Your Restaurant?
              </h2>
              <p className="text-background/70 text-lg mb-8">
                Join 500+ restaurants already using Scan2Serve to modernize their 
                dine-in experience. Get started in minutes with our simple onboarding.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="group"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="hero-outline" 
                  size="lg"
                  className="border-background/20 text-background hover:bg-background/10"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
            
            {/* Visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-3xl bg-background/10 backdrop-blur-sm border border-background/20 flex items-center justify-center">
                  <div className="w-48 h-48 bg-background rounded-2xl flex items-center justify-center shadow-lg">
                    <QrCode className="w-32 h-32 text-foreground" />
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary rounded-lg animate-float" />
                <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-secondary rounded-full animate-float delay-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
