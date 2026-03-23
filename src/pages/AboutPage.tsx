import { motion } from "framer-motion";
import { Target, Users, Award, Globe } from "lucide-react";

const values = [
  { icon: Target, title: "Excellence", desc: "We set the highest standards for football education and coaching development in Portugal." },
  { icon: Users, title: "Community", desc: "Built by coaches, for coaches. Every feature is designed with real training needs in mind." },
  { icon: Award, title: "Innovation", desc: "Cutting-edge tools like animated tactic boards and AI-powered drill suggestions." },
  { icon: Globe, title: "Accessibility", desc: "From grassroots to professional — every coach deserves access to world-class resources." },
];

export default function AboutPage() {
  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="max-w-3xl mx-auto text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
            About Us
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-foreground">
            Building the Future of{" "}
            <span className="gradient-text">Football Coaching</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Elite-Connect was born from a simple observation: Portuguese football coaches lacked a dedicated, professional-grade platform to share knowledge, connect with peers, and advance their careers.
          </p>
        </motion.div>

        {/* Story */}
        <motion.div
          className="glass-card p-8 md:p-12 mb-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Our Story</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Portugal produces some of the world's best football talent, yet the coaches behind this success have never had a platform that truly serves their needs. Scattered across WhatsApp groups, outdated forums, and disconnected tools — the coaching community deserved better.
            </p>
            <p>
              Elite-Connect brings together three essential pillars: a <span className="text-primary font-medium">Technical Hub</span> inspired by KNVB Rinus for drills and tactical planning, a <span className="text-primary font-medium">Professional Network</span> for connecting coaches, clubs, and scouts, and a <span className="text-primary font-medium">Marketplace</span> for coaching services and career opportunities.
            </p>
            <p>
              We're building the "LinkedIn for football" — but with the tactical depth that coaches actually need.
            </p>
          </div>
        </motion.div>

        {/* Values */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              className="glass-card-hover p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <v.icon className="text-primary" size={20} />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
