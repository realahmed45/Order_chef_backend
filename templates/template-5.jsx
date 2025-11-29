import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  MapPin,
  Clock,
  Check,
  Trash2,
  Star,
  Phone,
  Award,
  Utensils,
  ArrowRight,
  Search,
  Flame,
} from "lucide-react";

const MENU_ITEMS = [
  {
    id: 1,
    name: "Wagyu Beef Burger",
    description: "Premium A5 Wagyu beef, black truffle aioli, aged Gruyère",
    price: 34.99,
    category: "Signature",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop",
    rating: 4.9,
    reviews: 247,
    popular: true,
    prepTime: "15 min",
  },
  {
    id: 2,
    name: "Truffle Margherita",
    description: "San Marzano tomatoes, buffalo mozzarella, black truffle",
    price: 28.99,
    category: "Pizza",
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop",
    rating: 4.8,
    reviews: 312,
    popular: true,
    prepTime: "18 min",
  },
  {
    id: 3,
    name: "Chilean Sea Bass",
    description: "Pan-seared sea bass, lemon beurre blanc, asparagus",
    price: 42.99,
    category: "Seafood",
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop",
    rating: 4.9,
    reviews: 189,
    popular: true,
    prepTime: "20 min",
  },
  {
    id: 4,
    name: "Lobster Thermidor",
    description: "Maine lobster, cognac cream sauce, gruyère cheese",
    price: 58.99,
    category: "Seafood",
    image:
      "https://images.unsplash.com/photo-1625944525533-473f29302ddb?w=800&h=600&fit=crop",
    rating: 5.0,
    reviews: 156,
    popular: true,
    prepTime: "25 min",
  },
  {
    id: 5,
    name: "Prime Ribeye Steak",
    description: "28-day dry-aged USDA Prime ribeye, truffle mashed potatoes",
    price: 54.99,
    category: "Steaks",
    image:
      "https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=600&fit=crop",
    rating: 4.9,
    reviews: 278,
    popular: true,
    prepTime: "22 min",
  },
  {
    id: 6,
    name: "Wild Mushroom Risotto",
    description: "Arborio rice, porcini, shiitake, white truffle oil",
    price: 26.99,
    category: "Italian",
    image:
      "https://images.unsplash.com/photo-1476124369491-c0adbc69a32f?w=800&h=600&fit=crop",
    rating: 4.8,
    reviews: 203,
    prepTime: "20 min",
  },
  {
    id: 7,
    name: "Peking Duck",
    description: "Traditional preparation, crispy skin, hoisin sauce",
    price: 38.99,
    category: "Asian",
    image:
      "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&h=600&fit=crop",
    rating: 4.9,
    reviews: 167,
    popular: true,
    prepTime: "30 min",
  },
  {
    id: 8,
    name: "Seared Scallops",
    description: "Hokkaido scallops, cauliflower purée, blood orange gastrique",
    price: 36.99,
    category: "Seafood",
    image:
      "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=800&h=600&fit=crop",
    rating: 4.8,
    reviews: 145,
    prepTime: "16 min",
  },
];

const CATEGORIES = [
  "All",
  "Signature",
  "Seafood",
  "Steaks",
  "Italian",
  "Asian",
  "Pizza",
];

const LoadingScreen = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 100 : prev + 2));
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isLoading]);
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-950 via-red-900 to-red-950 z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Flame
            size={64}
            className="text-amber-400 mx-auto mb-4 animate-pulse"
          />
          <h1 className="text-5xl font-black tracking-tight text-amber-100 mb-2">
            INFERNO
          </h1>
          <p className="text-sm tracking-[0.3em] text-red-300">STEAKHOUSE</p>
        </div>
        <div className="w-64 h-1 bg-red-900 mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ cartCount, onCartClick }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-red-950/95 backdrop-blur-lg shadow-2xl border-b border-amber-600/30"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Flame size={32} className="text-amber-400" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-amber-100">
                INFERNO
              </h1>
              <p className="text-[9px] tracking-[0.25em] text-red-400">
                STEAKHOUSE
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {["Home", "Menu", "About", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-bold tracking-wider text-red-200 hover:text-amber-400 transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-1 bg-amber-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
          <div className="flex items-center space-x-6">
            <button className="hidden md:block text-red-200 hover:text-amber-400 transition">
              <Search size={20} />
            </button>
            <button onClick={onCartClick} className="relative group">
              <ShoppingCart
                size={20}
                className="text-red-200 group-hover:text-amber-400 transition"
              />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-red-950 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-red-900 to-red-950"
    >
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-500 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-flex items-center space-x-3 border-2 border-amber-500 px-8 py-3 bg-amber-500/20 backdrop-blur-sm mb-8">
              <Flame size={18} className="text-amber-400" />
              <p className="text-xs font-black tracking-[0.3em] text-amber-300">
                WOOD-FIRED PERFECTION
              </p>
            </div>
          </div>
          <h1
            className="text-7xl md:text-9xl font-black text-amber-100 mb-6 leading-none animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            PRIME
            <br />
            <span className="text-amber-400">CUTS</span>
          </h1>
          <p
            className="text-xl font-semibold text-red-200 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Premium aged steaks grilled to perfection over open flames
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <a
              href="#menu"
              className="group bg-gradient-to-r from-amber-500 to-amber-600 text-red-950 px-12 py-4 text-sm font-black tracking-wider hover:shadow-2xl hover:shadow-amber-500/50 transition-all flex items-center space-x-2"
            >
              <span>VIEW MENU</span>
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
            <a
              href="#reservations"
              className="group border-2 border-amber-500 text-amber-400 px-12 py-4 text-sm font-black tracking-wider hover:bg-amber-500 hover:text-red-950 transition-all"
            >
              RESERVE TABLE
            </a>
          </div>
          <div
            className="grid grid-cols-3 gap-8 mt-24 max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              { value: "1200°F", label: "Wood Fire" },
              { value: "Prime", label: "Beef" },
              { value: "28-Day", label: "Dry Aged" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-black text-amber-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-xs tracking-widest text-red-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Flame size={40} />,
      title: "Wood-Fired Grill",
      description: "1200°F open flame for perfect sear and smoky flavor",
    },
    {
      icon: <Award size={40} />,
      title: "Prime Selection",
      description: "USDA Prime beef aged 28 days for tenderness",
    },
    {
      icon: <Utensils size={40} />,
      title: "Bold Flavors",
      description: "Italian-American classics with robust seasonings",
    },
  ];

  return (
    <section className="py-32 bg-red-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <p className="text-xs font-black tracking-[0.3em] text-amber-400 mb-4">
            THE INFERNO DIFFERENCE
          </p>
          <h2 className="text-5xl font-black text-amber-100">
            Unmatched Quality
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="mb-6 text-amber-400 inline-block transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black text-amber-100 mb-4">
                {feature.title}
              </h3>
              <p className="text-red-300 leading-relaxed font-semibold">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MenuItemCard = ({ item, onAddToCart }) => {
  return (
    <div className="group bg-red-950 border-2 border-red-800 overflow-hidden hover:shadow-2xl hover:shadow-amber-500/30 hover:border-amber-500 transition-all duration-500">
      <div className="relative h-72 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-red-950 via-red-950/70 to-transparent" />
        {item.popular && (
          <div className="absolute top-4 left-4 bg-amber-500 text-red-950 px-4 py-1.5 text-xs font-black tracking-wider">
            BESTSELLER
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-2xl font-black text-amber-100 mb-2">
            {item.name}
          </h3>
          <p className="text-sm text-red-300 mb-3 font-medium">
            {item.description}
          </p>
          <div className="flex items-center space-x-3 text-xs text-red-500">
            <div className="flex items-center space-x-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-amber-400 font-bold">{item.rating}</span>
            </div>
            <span>•</span>
            <span className="font-semibold">{item.prepTime}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t-2 border-red-800">
          <span className="text-3xl font-black text-amber-400">
            ${item.price}
          </span>
          <button
            onClick={() => onAddToCart(item)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-red-950 px-6 py-2.5 text-xs font-black tracking-wider hover:shadow-lg hover:shadow-amber-500/50 transition-all flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>ADD</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuSection = ({ onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState(MENU_ITEMS);

  useEffect(() => {
    let items = MENU_ITEMS;
    if (selectedCategory !== "All")
      items = items.filter((item) => item.category === selectedCategory);
    if (searchQuery)
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    setFilteredItems(items);
  }, [selectedCategory, searchQuery]);

  return (
    <section id="menu" className="py-32 bg-red-950">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-black tracking-[0.3em] text-amber-400 mb-4">
            MAIN MENU
          </p>
          <h2 className="text-5xl font-black text-amber-100 mb-6">
            Our Selection
          </h2>
          <p className="text-red-300 max-w-2xl mx-auto font-semibold">
            Bold flavors, prime cuts, unforgettable meals
          </p>
        </div>
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-red-900 border-2 border-red-800 py-3 pl-12 pr-4 text-sm text-amber-100 placeholder-red-500 focus:outline-none focus:border-amber-500 transition-colors font-semibold"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 text-xs font-black tracking-wider transition-all ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-red-950 shadow-lg shadow-amber-500/30"
                  : "border-2 border-red-800 text-red-300 hover:border-amber-500 hover:text-amber-400"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
};

const CartModal = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const deliveryFee = 5.99;
  const total = subtotal + tax + deliveryFee;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-red-950 border-2 border-red-800 w-full md:max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-red-950">
            YOUR ORDER
          </h2>
          <button
            onClick={onClose}
            className="text-red-950 hover:text-red-800 transition"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-96">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart size={48} className="mx-auto mb-4 text-red-800" />
              <p className="text-red-400 font-semibold">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 border-b-2 border-red-800 pb-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-black text-amber-100">{item.name}</h3>
                    <p className="text-sm text-amber-400 font-bold">
                      ${item.price}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-8 h-8 border-2 border-red-800 flex items-center justify-center hover:bg-red-900 text-red-300"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-amber-100 font-black">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                      className="w-8 h-8 bg-amber-500 text-red-950 flex items-center justify-center hover:bg-amber-600 font-black"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t-2 border-red-800 p-6 bg-red-900">
            <div className="space-y-2 mb-6 text-sm font-semibold">
              <div className="flex justify-between text-red-300">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-300">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-300">
                <span>Delivery</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-black pt-4 border-t-2 border-red-800 text-amber-100">
                <span>Total</span>
                <span className="text-amber-400">${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-red-950 py-4 text-sm font-black tracking-wider hover:shadow-xl hover:shadow-amber-500/50 transition-all"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CheckoutModal = ({ isOpen, onClose, cart, total }) => {
  const [step, setStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    paymentMethod: "cod",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handlePlaceOrder = () => {
    setOrderNumber(`IF${Date.now().toString().slice(-6)}`);
    setOrderPlaced(true);
  };

  if (!isOpen) return null;

  if (orderPlaced) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-red-950 border-2 border-red-800 max-w-md w-full p-12 text-center animate-scale-in">
          <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto flex items-center justify-center mb-6">
            <Check size={40} className="text-red-950" />
          </div>
          <h2 className="text-3xl font-black text-amber-100 mb-2">
            Order Confirmed!
          </h2>
          <p className="text-amber-400 font-bold mb-8">Order #{orderNumber}</p>
          <button
            onClick={() => {
              setOrderPlaced(false);
              setStep(1);
              onClose();
            }}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-red-950 px-8 py-3 text-sm font-black tracking-wider hover:shadow-lg transition"
          >
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-red-950 border-2 border-red-800 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-red-950">
            CHECKOUT
          </h2>
          <button onClick={onClose} className="text-red-950 hover:text-red-800">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto max-h-96">
          {step === 1 && (
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                className="w-full bg-red-900 border-2 border-red-800 px-4 py-3 text-sm text-amber-100 placeholder-red-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                className="w-full bg-red-900 border-2 border-red-800 px-4 py-3 text-sm text-amber-100 placeholder-red-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone"
                className="w-full bg-red-900 border-2 border-red-800 px-4 py-3 text-sm text-amber-100 placeholder-red-500 focus:outline-none focus:border-amber-500"
              />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Address"
                rows="3"
                className="w-full bg-red-900 border-2 border-red-800 px-4 py-3 text-sm text-amber-100 placeholder-red-500 focus:outline-none focus:border-amber-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="bg-red-900 border-2 border-red-800 px-4 py-3 text-sm text-amber-100 placeholder-red-500 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="ZIP"
                  className="bg-red-900 border-2 border-red-800 px-4 py-3 text-sm text-amber-100 placeholder-red-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <label className="flex items-center border-2 border-red-800 p-4 cursor-pointer hover:bg-red-900">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <span className="text-sm text-amber-100 font-bold">
                  Cash on Delivery
                </span>
              </label>
              <label className="flex items-center border-2 border-red-800 p-4 cursor-pointer hover:bg-red-900">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <span className="text-sm text-amber-100 font-bold">
                  Credit Card
                </span>
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="border-2 border-red-800 p-6">
              <h3 className="font-black text-xl mb-4 text-amber-100">
                Order Summary
              </h3>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm mb-2 text-red-300 font-semibold"
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t-2 border-red-800 mt-4 pt-4 flex justify-between font-black text-xl">
                <span className="text-amber-100">Total</span>
                <span className="text-amber-400">${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="border-t-2 border-red-800 p-6 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="border-2 border-red-800 px-6 py-3 text-xs font-black tracking-wider hover:border-amber-500 text-red-300"
            >
              BACK
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="ml-auto bg-gradient-to-r from-amber-500 to-amber-600 text-red-950 px-6 py-3 text-xs font-black tracking-wider hover:shadow-lg"
            >
              NEXT
            </button>
          ) : (
            <button
              onClick={handlePlaceOrder}
              className="ml-auto bg-gradient-to-r from-amber-500 to-amber-600 text-red-950 px-6 py-3 text-xs font-black tracking-wider hover:shadow-lg"
            >
              PLACE ORDER
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const About = () => {
  return (
    <section id="about" className="py-32 bg-red-900">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">
          <div>
            <p className="text-xs font-black tracking-[0.3em] text-amber-400 mb-4">
              OUR STORY
            </p>
            <h2 className="text-5xl font-black text-amber-100 mb-8">
              Fire & Flavor
            </h2>
            <p className="text-red-300 mb-6 leading-relaxed font-semibold">
              Since 2010, Inferno has been serving the finest prime steaks in
              the city. Our wood-fired grill reaches 1200°F, creating the
              perfect crust while keeping the inside tender and juicy.
            </p>
            <p className="text-red-300 leading-relaxed font-semibold">
              Every cut is hand-selected, dry-aged for 28 days, and grilled to
              your exact specifications.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=500&fit=crop"
              alt="Restaurant"
              className="w-full h-64 object-cover border-2 border-red-800"
            />
            <img
              src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&h=500&fit=crop"
              alt="Chef"
              className="w-full h-64 object-cover mt-12 border-2 border-red-800"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  return (
    <section id="contact" className="py-32 bg-red-950">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-black tracking-[0.3em] text-amber-400 mb-4">
            VISIT US
          </p>
          <h2 className="text-5xl font-black text-amber-100">Get In Touch</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {[
            {
              icon: <MapPin size={28} />,
              title: "Location",
              info: "999 Flame Street\nGrill District 54321",
            },
            {
              icon: <Clock size={28} />,
              title: "Hours",
              info: "Daily\n5:00 PM - 11:00 PM",
            },
            {
              icon: <Phone size={28} />,
              title: "Reserve",
              info: "+1 (555) 999-8888\nreserve@inferno.com",
            },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-amber-400 mb-4 inline-block">
                {item.icon}
              </div>
              <h3 className="text-xl font-black mb-3 text-amber-100">
                {item.title}
              </h3>
              <p className="text-sm text-red-300 whitespace-pre-line leading-relaxed font-semibold">
                {item.info}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-red-950 border-t-2 border-red-900 py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <Flame size={48} className="mx-auto mb-4 text-amber-400" />
          <h3 className="text-2xl font-black text-amber-100 mb-2">INFERNO</h3>
          <p className="text-xs text-red-500 tracking-[0.3em]">STEAKHOUSE</p>
        </div>
        <div className="text-center text-sm text-red-800">
          <p>© 2024 Inferno Steakhouse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default function RestaurantApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.id !== id));
    } else {
      setCart(
        cart.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };
  const handleRemoveItem = (id) =>
    setCart(cart.filter((item) => item.id !== id));
  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fade-in { animation: fade-in 0.5s ease-out; } .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; } .animate-scale-in { animation: scale-in 0.3s ease-out; }`}</style>
      <LoadingScreen isLoading={isLoading} />
      {!isLoading && (
        <div className="min-h-screen bg-red-950">
          <Navbar
            cartCount={cartCount}
            onCartClick={() => setIsCartOpen(true)}
          />
          <Hero />
          <Features />
          <MenuSection onAddToCart={handleAddToCart} />
          <About />
          <Contact />
          <Footer />
          <CartModal
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
          />
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            cart={cart}
            total={
              cart.reduce((sum, item) => sum + item.price * item.quantity, 0) +
              (cart.length > 0
                ? 5.99 +
                  cart.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  ) *
                    0.1
                : 0)
            }
          />
        </div>
      )}
    </>
  );
}
