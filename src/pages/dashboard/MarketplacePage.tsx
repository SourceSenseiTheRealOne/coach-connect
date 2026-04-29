import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  MapPin,
  ShoppingBag,
  Filter,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMarketplaceListings } from "@/hooks/use-marketplace";

export default function MarketplacePage() {
  const { data: listingsData, isLoading, error } = useMarketplaceListings();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load listings</p>
      </div>
    );
  }

  const listings = listingsData?.items || [];
  const filteredListings = listings.filter(
    (listing) =>
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground">
          Marketplace
        </h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button className="p-2.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredListings.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No listings found matching your search
          </div>
        ) : (
          filteredListings.map((item, i) => (
            <motion.div
              key={item.id}
              className="glass-card-hover p-5 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-3">
                <Badge
                  variant="outline"
                  className="text-xs border-border text-muted-foreground"
                >
                  {item.service_type || "Service"}
                </Badge>
                {item.is_remote && (
                  <Badge className="text-xs bg-primary/10 text-primary border-0">
                    Remote
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {item.description?.slice(0, 100)}...
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {item.service_area || "Location"}
                </span>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="font-display font-bold text-primary">
                  {item.price_cents
                    ? `€${(item.price_cents / 100).toFixed(2)}`
                    : "Contact"}
                </span>
                <ShoppingBag size={16} className="text-muted-foreground" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
