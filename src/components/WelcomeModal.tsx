import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Target,
  Calendar,
  Users,
  MessageSquare,
  Trophy,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";

const slides = [
  {
    id: "exercise-library",
    icon: BookOpen,
    title: "Exercise Library",
    description:
      "Browse 1000+ drills organized by category, age group, and difficulty. Share your own exercises with the community.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    id: "tactic-board",
    icon: Target,
    title: "Tactic Board",
    description:
      "Design formations, draw movement arrows, and create animated tactical sequences for your team.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "season-planner",
    icon: Calendar,
    title: "Season Planner",
    description:
      "Plan weeks, months, or entire seasons with drag-and-drop training sessions and periodization support.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "professional-network",
    icon: Users,
    title: "Professional Network",
    description:
      "Connect with coaches, clubs, and scouts across Portugal. Build your professional reputation.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "real-time-messaging",
    icon: MessageSquare,
    title: "Real-Time Messaging",
    description:
      "Instant messaging with your network. Share exercises, tactics, and opportunities directly.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "job-board",
    icon: Trophy,
    title: "Job Board",
    description:
      "Find coaching positions or post vacancies. Discover talent and advance your career.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasSeenModal, setHasSeenModal] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("welcome-modal-seen");
    if (!seen) {
      setHasSeenModal(false);
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("welcome-modal-seen", "true");
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (hasSeenModal) return null;

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-display text-center">
              Welcome to <span className="gradient-text">Coach Connect</span>
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              The #1 platform for football coaches in Portugal
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="text-center"
              >
                <div
                  className={`w-16 h-16 rounded-2xl ${slide.bgColor} flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className={`${slide.color}`} size={32} />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 text-foreground">
                  {slide.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="gap-1"
          >
            <ChevronLeft size={16} />
            Back
          </Button>

          {currentSlide === slides.length - 1 ? (
            <Button size="sm" onClick={handleClose} className="gap-1">
              Get Started
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              className="gap-1"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
