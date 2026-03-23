import { motion } from "framer-motion";
import { Search, Star, MapPin, ShoppingBag, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const listings = [
  { id: 1, title: "Private 1-on-1 Training Sessions", seller: "Carlos Mendes", type: "Private Training", price: "€45/session", rating: 4.8, reviews: 23, location: "Lisboa", remote: false },
  { id: 2, title: "Professional Video Analysis", seller: "Sofia Lima", type: "Video Analysis", price: "€75/match", rating: 4.9, reviews: 41, location: "Remote", remote: true },
  { id: 3, title: "Youth Team Consulting", seller: "Miguel Santos", type: "Consulting", price: "€120/hour", rating: 4.7, reviews: 15, location: "Porto", remote: false },
  { id: 4, title: "Goalkeeper Training Program", seller: "Ana Rodrigues", type: "Private Training", price: "€55/session", rating: 5.0, reviews: 8, location: "Braga", remote: false },
  { id: 5, title: "Scout Report Package", seller: "Pedro Almeida", type: "Scouting", price: "€200/report", rating: 4.6, reviews: 32, location: "Remote", remote: true },
  { id: 6, title: "Team Building Workshop", seller: "João Ferreira", type: "Event", price: "€500/event", rating: 4.8, reviews: 11, location: "Lisboa", remote: false },
];

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground">Marketplace</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search services..." className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <button className="p-2.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((item, i) => (
          <motion.div
            key={item.id}
            className="glass-card-hover p-5 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">{item.type}</Badge>
              {item.remote && <Badge className="text-xs bg-primary/10 text-primary border-0">Remote</Badge>}
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{item.seller}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><MapPin size={12} /> {item.location}</span>
              <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" /> {item.rating} ({item.reviews})</span>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="font-display font-bold text-primary">{item.price}</span>
              <ShoppingBag size={16} className="text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
