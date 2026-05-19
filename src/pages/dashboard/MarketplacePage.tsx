import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  Edit,
  Filter,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  ShoppingBag,
  ShieldCheck,
  Star,
  Trash2,
  X,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MarketplaceFilters,
  useAdminMarketplaceBalance,
  useAdminMarketplaceOrders,
  useAdminPayoutProfiles,
  useAdminUpdateMarketplacePayout,
  useContactMarketplaceSeller,
  useCreateMarketplaceCheckout,
  useCreateListing,
  useCreateReview,
  useDeleteListing,
  useMyMarketplacePurchases,
  useMyMarketplaceSales,
  useMyPayoutProfile,
  useMarketplaceListings,
  useMarketplaceReviews,
  useUpsertPayoutProfile,
  useUpdateListing,
} from "@/hooks/use-marketplace";
import { useMySubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/lib/auth-context";
import type {
  MarketplaceListing,
  MarketplaceOrder,
  PriceType,
  ServiceType,
  SellerPayoutProfile,
  SubscriptionTier,
} from "@/shared/types";

const serviceOptions: Array<{ value: ServiceType; label: string }> = [
  { value: "private_training", label: "Private training" },
  { value: "video_analysis", label: "Video analysis" },
  { value: "consulting", label: "Consulting" },
  { value: "scouting", label: "Scouting" },
  { value: "event_organizing", label: "Event organizing" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];

const priceTypeOptions: Array<{ value: PriceType; label: string }> = [
  { value: "fixed", label: "Fixed" },
  { value: "hourly", label: "Hourly" },
  { value: "per_session", label: "Per session" },
  { value: "contact", label: "Contact" },
];

const allowedListingTiers: SubscriptionTier[] = ["pro_service", "club_license"];

interface ListingFormState {
  title: string;
  description: string;
  service_type: ServiceType;
  price: string;
  price_type: PriceType;
  service_area: string;
  is_remote: boolean;
}

interface PayoutFormState {
  account_holder_name: string;
  payout_method: "iban" | "bank_transfer";
  country: string;
  currency: string;
  bank_reference: string;
}

const emptyForm: ListingFormState = {
  title: "",
  description: "",
  service_type: "private_training",
  price: "",
  price_type: "fixed",
  service_area: "",
  is_remote: false,
};

const emptyPayoutForm: PayoutFormState = {
  account_holder_name: "",
  payout_method: "iban",
  country: "PT",
  currency: "EUR",
  bank_reference: "",
};

function serviceLabel(value: string | null | undefined) {
  return (
    serviceOptions.find((option) => option.value === value)?.label || "Service"
  );
}

function formatPrice(listing: MarketplaceListing) {
  if (listing.price_type === "contact" || listing.price_cents === null) {
    return "Contact";
  }

  const amount = `${listing.currency || "EUR"} ${(listing.price_cents / 100).toFixed(2)}`;

  if (listing.price_type === "hourly") return `${amount}/hr`;
  if (listing.price_type === "per_session") return `${amount}/session`;
  return amount;
}

function formatMoney(amountCents: number, currency: string) {
  return `${currency.toUpperCase()} ${(amountCents / 100).toFixed(2)}`;
}

function shortId(id: string | null | undefined) {
  if (!id) return "Unknown";
  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}

function formFromListing(listing: MarketplaceListing): ListingFormState {
  return {
    title: listing.title,
    description: listing.description,
    service_type: listing.service_type,
    price:
      listing.price_cents === null
        ? ""
        : (listing.price_cents / 100).toString(),
    price_type: listing.price_type || "fixed",
    service_area: listing.service_area || "",
    is_remote: listing.is_remote,
  };
}

function toListingInput(form: ListingFormState, images: string[] = []) {
  const price = form.price.trim();
  const priceCents =
    form.price_type === "contact" || price === ""
      ? null
      : Math.round(Number(price) * 100);

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    service_type: form.service_type,
    price_cents: priceCents,
    price_type: form.price_type,
    currency: "EUR",
    images,
    service_area: form.service_area.trim() || null,
    is_remote: form.is_remote,
  };
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { data: subscription } = useMySubscription();
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType | "all">("all");
  const [remoteFilter, setRemoteFilter] = useState<"all" | "remote" | "local">(
    "all",
  );
  const [selectedListing, setSelectedListing] =
    useState<MarketplaceListing | null>(null);
  const [listingDialogOpen, setListingDialogOpen] = useState(false);
  const [editingListing, setEditingListing] =
    useState<MarketplaceListing | null>(null);
  const [form, setForm] = useState<ListingFormState>(emptyForm);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutForm, setPayoutForm] =
    useState<PayoutFormState>(emptyPayoutForm);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");

  const activeTier = (subscription?.subscription_tier ||
    profile?.subscription_tier ||
    "free") as SubscriptionTier;
  const canCreateListing = allowedListingTiers.includes(activeTier);
  const isAdmin = profile?.user_type === "admin";

  const filters = useMemo<MarketplaceFilters>(
    () => ({
      search: searchQuery.trim() || undefined,
      service_type: serviceType === "all" ? undefined : serviceType,
      is_remote: remoteFilter === "all" ? undefined : remoteFilter === "remote",
    }),
    [remoteFilter, searchQuery, serviceType],
  );

  const {
    data: listingsData,
    isLoading,
    error,
  } = useMarketplaceListings(filters);
  const { data: reviews = [], isLoading: reviewsLoading } =
    useMarketplaceReviews(selectedListing?.id || null);
  const { data: payoutProfile } = useMyPayoutProfile();
  const { data: mySales = [] } = useMyMarketplaceSales();
  const { data: myPurchases = [] } = useMyMarketplacePurchases();
  const { data: adminOrders = [] } = useAdminMarketplaceOrders(isAdmin);
  const { data: adminPayoutProfiles = [] } = useAdminPayoutProfiles(isAdmin);
  const { data: adminBalance } = useAdminMarketplaceBalance(isAdmin);
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const createReview = useCreateReview();
  const upsertPayoutProfile = useUpsertPayoutProfile();
  const createCheckout = useCreateMarketplaceCheckout();
  const contactSeller = useContactMarketplaceSeller();
  const adminUpdatePayout = useAdminUpdateMarketplacePayout();

  const listings = listingsData?.items || [];
  const averageRating =
    reviews.length === 0
      ? null
      : reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length;
  const payoutProfilesByUser = useMemo(
    () =>
      new Map(
        adminPayoutProfiles.map((profile: SellerPayoutProfile) => [
          profile.user_id,
          profile,
        ]),
      ),
    [adminPayoutProfiles],
  );

  function openCreateDialog() {
    if (!canCreateListing) return;
    setEditingListing(null);
    setForm(emptyForm);
    setListingDialogOpen(true);
  }

  function openEditDialog(listing: MarketplaceListing) {
    setSelectedListing(null);
    setEditingListing(listing);
    setForm(formFromListing(listing));
    setListingDialogOpen(true);
  }

  async function handleSubmitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreateListing && !editingListing) {
      toast({
        title: "Upgrade required",
        description:
          "Marketplace listings require Pro Service or Club License.",
        variant: "destructive",
      });
      return;
    }

    const input = toListingInput(form, editingListing?.images || []);
    if (!input.title || !input.description) {
      toast({
        title: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    if (input.price_cents !== null && Number.isNaN(input.price_cents)) {
      toast({ title: "Enter a valid price", variant: "destructive" });
      return;
    }

    const isPaidListing =
      input.price_type !== "contact" && (input.price_cents ?? 0) > 0;
    if (isPaidListing && !payoutProfile) {
      setPayoutDialogOpen(true);
      toast({
        title: "Payout details required",
        description: "Add bank payout details before selling paid services.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingListing) {
        const updated = await updateListing.mutateAsync({
          id: editingListing.id,
          ...input,
        });
        setSelectedListing(updated);
        toast({ title: "Listing updated" });
      } else {
        const created = await createListing.mutateAsync(input);
        setSelectedListing(created);
        toast({ title: "Listing created" });
      }
      setListingDialogOpen(false);
      setForm(emptyForm);
      setEditingListing(null);
    } catch (listingError) {
      toast({
        title: editingListing
          ? "Failed to update listing"
          : "Failed to create listing",
        description:
          listingError instanceof Error ? listingError.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function handleDeleteListing(listing: MarketplaceListing) {
    if (!confirm("Delete this marketplace listing?")) return;

    try {
      await deleteListing.mutateAsync(listing.id);
      if (selectedListing?.id === listing.id) setSelectedListing(null);
      toast({ title: "Listing deleted" });
    } catch (deleteError) {
      toast({
        title: "Failed to delete listing",
        description:
          deleteError instanceof Error ? deleteError.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function handleCreateReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedListing) return;

    try {
      await createReview.mutateAsync({
        listing_id: selectedListing.id,
        rating: Number(reviewRating),
        comment: reviewComment.trim() || null,
      });
      setReviewRating("5");
      setReviewComment("");
      toast({ title: "Review posted" });
    } catch (reviewError) {
      toast({
        title: "Failed to post review",
        description:
          reviewError instanceof Error ? reviewError.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function handleSavePayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await upsertPayoutProfile.mutateAsync({
        account_holder_name: payoutForm.account_holder_name.trim(),
        payout_method: payoutForm.payout_method,
        country: payoutForm.country.trim().toUpperCase(),
        currency: payoutForm.currency.trim().toUpperCase(),
        bank_reference: payoutForm.bank_reference.trim(),
      });
      setPayoutDialogOpen(false);
      setPayoutForm(emptyPayoutForm);
      toast({ title: "Payout details saved" });
    } catch (payoutError) {
      toast({
        title: "Failed to save payout details",
        description:
          payoutError instanceof Error ? payoutError.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function handleBuyListing(listing: MarketplaceListing) {
    try {
      const checkout = await createCheckout.mutateAsync({
        listing_id: listing.id,
      });
      if (checkout.url) {
        window.location.href = checkout.url;
      }
    } catch (checkoutError) {
      toast({
        title: "Failed to start checkout",
        description:
          checkoutError instanceof Error ? checkoutError.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function handleContactSeller(listing: MarketplaceListing) {
    try {
      await contactSeller.mutateAsync(listing.id);
      navigate("/dashboard/messages");
    } catch (contactError) {
      toast({
        title: "Failed to contact seller",
        description:
          contactError instanceof Error ? contactError.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function handleAdminUpdatePayout(
    order: MarketplaceOrder,
    payout_status: "processing" | "paid" | "failed",
  ) {
    try {
      await adminUpdatePayout.mutateAsync({
        order_id: order.id,
        payout_status,
      });
      toast({ title: "Payout status updated" });
    } catch (payoutError) {
      toast({
        title: "Failed to update payout",
        description:
          payoutError instanceof Error ? payoutError.message : undefined,
        variant: "destructive",
      });
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setServiceType("all");
    setRemoteFilter("all");
  }

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

  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Marketplace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Services from coaches, scouts, analysts, and clubs.
          </p>
        </div>
        {canCreateListing ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => setPayoutDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Wallet size={16} />
              {payoutProfile ? "Payout details" : "Add payout details"}
            </Button>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus size={16} /> New Listing
            </Button>
          </div>
        ) : (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/pricing">
              <Lock size={16} /> Upgrade to list services
            </Link>
          </Button>
        )}
      </motion.div>

      <div className="grid gap-3 lg:grid-cols-[1fr_180px_150px_auto]">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Select
          value={serviceType}
          onValueChange={(value) =>
            setServiceType(value as ServiceType | "all")
          }
        >
          <SelectTrigger className="bg-muted/40 border-border text-foreground">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {serviceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={remoteFilter}
          onValueChange={(value) =>
            setRemoteFilter(value as "all" | "remote" | "local")
          }
        >
          <SelectTrigger className="bg-muted/40 border-border text-foreground">
            <SelectValue placeholder="Delivery" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All delivery</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="local">Local</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={clearFilters}>
          <X size={16} /> Clear
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter size={14} />
        <span>{listingsData?.total || 0} live listings</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No listings found matching current filters
          </div>
        ) : (
          listings.map((item, index) => {
            const isOwner = item.seller_id === user?.id;
            return (
              <motion.article
                key={item.id}
                className="glass-card-hover p-5 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.03 }}
                onClick={() => setSelectedListing(item)}
              >
                <div className="flex items-center justify-between mb-3 gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs border-border text-muted-foreground"
                  >
                    {serviceLabel(item.service_type)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {item.is_remote && (
                      <Badge className="text-xs bg-primary/10 text-primary border-0">
                        Remote
                      </Badge>
                    )}
                    {isOwner && (
                      <Badge className="text-xs bg-muted text-muted-foreground border-0">
                        Yours
                      </Badge>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                  {item.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {item.service_area || "Flexible"}
                  </span>
                </div>
                <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                  <span className="font-display font-bold text-primary">
                    {formatPrice(item)}
                  </span>
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label={`Edit ${item.title}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditDialog(item);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Delete ${item.title}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteListing(item);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                    <ShoppingBag size={16} className="text-muted-foreground" />
                  </div>
                </div>
              </motion.article>
            );
          })
        )}
      </div>

      {!canCreateListing && (
        <div className="border border-border bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
          Marketplace browsing is available on your current tier. Creating
          listings requires Pro Service or Club License.
        </div>
      )}

      {(mySales.length > 0 || myPurchases.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Your sales
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Paid sales are processed manually. Payout target: within 7 days.
            </p>
            <div className="mt-3 space-y-2">
              {mySales.slice(0, 3).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background/60 p-3 text-sm"
                >
                  <span>
                    {sale.currency} {(sale.seller_net_cents / 100).toFixed(2)}
                  </span>
                  <Badge variant="outline">{sale.payout_status}</Badge>
                </div>
              ))}
              {mySales.length === 0 && (
                <p className="text-sm text-muted-foreground">No sales yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Your purchases
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Stripe confirms payment and CoachConnect records each purchase.
            </p>
            <div className="mt-3 space-y-2">
              {myPurchases.slice(0, 3).map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background/60 p-3 text-sm"
                >
                  <span>
                    {purchase.currency}{" "}
                    {(purchase.gross_amount_cents / 100).toFixed(2)}
                  </span>
                  <Badge variant="outline">{purchase.status}</Badge>
                </div>
              ))}
              {myPurchases.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No purchases yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={listingDialogOpen} onOpenChange={setListingDialogOpen}>
        <DialogContent className="glass-card border-border w-[calc(100vw-2rem)] max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingListing
                ? "Edit Marketplace Listing"
                : "New Marketplace Listing"}
            </DialogTitle>
            <DialogDescription>
              Listings are stored in Supabase and shown live in marketplace
              search.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitListing} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listing-title">Title</Label>
              <Input
                id="listing-title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="bg-muted/40 border-border"
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listing-description">Description</Label>
              <Textarea
                id="listing-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="bg-muted/40 border-border min-h-28"
                maxLength={10000}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Service type</Label>
                <Select
                  value={form.service_type}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      service_type: value as ServiceType,
                    }))
                  }
                >
                  <SelectTrigger className="bg-muted/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price type</Label>
                <Select
                  value={form.price_type}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      price_type: value as PriceType,
                    }))
                  }
                >
                  <SelectTrigger className="bg-muted/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="listing-price">Price EUR</Label>
                <Input
                  id="listing-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  disabled={form.price_type === "contact"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  className="bg-muted/40 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="listing-area">Service area</Label>
                <Input
                  id="listing-area"
                  value={form.service_area}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      service_area: event.target.value,
                    }))
                  }
                  className="bg-muted/40 border-border"
                  maxLength={200}
                />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_remote}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    is_remote: event.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              Remote service available
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setListingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createListing.isPending || updateListing.isPending}
              >
                {(createListing.isPending || updateListing.isPending) && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {editingListing ? "Save changes" : "Create listing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent className="glass-card border-border w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>Seller payout details</DialogTitle>
            <DialogDescription>
              Used by admins for manual bank transfers after marketplace sales.
              Payouts are processed within 7 days after payment.
              {payoutProfile
                ? ` Current saved account: ${payoutProfile.masked_bank_reference}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePayout} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-holder">Account holder</Label>
              <Input
                id="account-holder"
                value={payoutForm.account_holder_name}
                onChange={(event) =>
                  setPayoutForm((current) => ({
                    ...current,
                    account_holder_name: event.target.value,
                  }))
                }
                className="bg-muted/40 border-border"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payout-country">Country</Label>
                <Input
                  id="payout-country"
                  value={payoutForm.country}
                  onChange={(event) =>
                    setPayoutForm((current) => ({
                      ...current,
                      country: event.target.value.toUpperCase(),
                    }))
                  }
                  className="bg-muted/40 border-border"
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout-currency">Currency</Label>
                <Input
                  id="payout-currency"
                  value={payoutForm.currency}
                  onChange={(event) =>
                    setPayoutForm((current) => ({
                      ...current,
                      currency: event.target.value.toUpperCase(),
                    }))
                  }
                  className="bg-muted/40 border-border"
                  maxLength={3}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-reference">IBAN / bank reference</Label>
              <Input
                id="bank-reference"
                value={payoutForm.bank_reference}
                onChange={(event) =>
                  setPayoutForm((current) => ({
                    ...current,
                    bank_reference: event.target.value,
                  }))
                }
                className="bg-muted/40 border-border"
                minLength={8}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPayoutDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={upsertPayoutProfile.isPending}>
                {upsertPayoutProfile.isPending && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Save payout details
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedListing}
        onOpenChange={(open) => !open && setSelectedListing(null)}
      >
        <DialogContent className="glass-card border-border w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 sm:rounded-2xl">
          {selectedListing && (
            <>
              <DialogHeader className="space-y-3 border-b border-border/60 px-5 py-5 sm:px-7 sm:py-6 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {serviceLabel(selectedListing.service_type)}
                  </Badge>
                  {selectedListing.is_remote && <Badge>Remote</Badge>}
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-semibold leading-tight tracking-tight">
                  {selectedListing.title}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="text-muted-foreground">
                    {selectedListing.service_area || "Flexible location"}
                  </span>
                  <span className="hidden sm:inline text-muted-foreground/50">
                    •
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(selectedListing)}
                  </span>
                </DialogDescription>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                  <Star
                    size={16}
                    className="text-primary"
                    fill="currentColor"
                  />
                  {averageRating === null
                    ? "No reviews yet"
                    : `${averageRating.toFixed(1)} · ${reviews.length} review${
                        reviews.length === 1 ? "" : "s"
                      }`}
                </div>
              </DialogHeader>

              <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {selectedListing.description}
                </p>

                {selectedListing.seller_id === user?.id ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => openEditDialog(selectedListing)}
                    >
                      <Edit size={16} /> Edit
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      variant="destructive"
                      onClick={() => void handleDeleteListing(selectedListing)}
                    >
                      <Trash2 size={16} /> Delete
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="w-full sm:w-auto"
                        variant="secondary"
                        onClick={() => void handleContactSeller(selectedListing)}
                        disabled={contactSeller.isPending}
                      >
                        {contactSeller.isPending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <MessageCircle size={16} />
                        )}
                        Contact seller
                      </Button>
                      {selectedListing.price_type !== "contact" &&
                      selectedListing.price_cents ? (
                      <Button
                        className="w-full sm:w-auto"
                        onClick={() => void handleBuyListing(selectedListing)}
                        disabled={createCheckout.isPending}
                      >
                        {createCheckout.isPending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ShoppingBag size={16} />
                        )}
                        Buy now
                      </Button>
                      ) : null}
                    </div>
                    <form
                      onSubmit={handleCreateReview}
                      className="space-y-4 border-t border-border/60 pt-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <Select
                            value={reviewRating}
                            onValueChange={setReviewRating}
                          >
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <SelectItem key={rating} value={String(rating)}>
                                  {rating} star{rating === 1 ? "" : "s"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="review-comment">Review</Label>
                          <Textarea
                            id="review-comment"
                            value={reviewComment}
                            onChange={(event) =>
                              setReviewComment(event.target.value)
                            }
                            className="bg-background border-border min-h-[96px] resize-y"
                            maxLength={2000}
                            placeholder="Share feedback for this service..."
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={createReview.isPending}
                      >
                        {createReview.isPending && (
                          <Loader2 size={16} className="animate-spin" />
                        )}
                        Post review
                      </Button>
                    </form>
                  </div>
                )}

                <div className="space-y-3 border-t border-border/60 pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      Reviews
                    </h3>
                    {reviews.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {reviews.length} total
                      </span>
                    )}
                  </div>
                  {reviewsLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading reviews...
                    </p>
                  ) : reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No reviews for this listing yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-lg border border-border bg-muted/30 p-3 sm:p-4"
                        >
                          <div className="mb-1.5 flex items-center gap-0.5 text-primary">
                            {Array.from({ length: review.rating }).map(
                              (_, index) => (
                                <Star
                                  key={index}
                                  size={14}
                                  fill="currentColor"
                                />
                              ),
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-foreground">
                            {review.comment || "No comment left."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
