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
  Coffee,
} from "lucide-react";

const MENU_ITEMS = [
  {
    id: 1,
    name: "Wagyu Beef Burger",
    description: "Premium A5 Wagyu beef, black truffle aioli",
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
    description: "San Marzano tomatoes, buffalo mozzarella",
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
    description: "Pan-seared sea bass, lemon beurre blanc",
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
    description: "Maine lobster, cognac cream sauce",
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
    description: "28-day dry-aged USDA Prime ribeye",
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
    description: "Arborio rice, truffle oil",
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
    description: "Traditional preparation, hoisin sauce",
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
    description: "Hokkaido scallops, cauliflower purée",
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
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Coffee size={64} className="text-red-900 mx-auto mb-4" />
          <h1 className="text-5xl font-serif text-red-900 mb-2">
            Bistro Classique
          </h1>
          <p className="text-sm tracking-[0.3em] text-red-800">EST. 1952</p>
        </div>
        <div className="w-64 h-px bg-red-300 mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-800 to-red-900 transition-all duration-300"
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
          ? "bg-amber-50/95 backdrop-blur-sm shadow-md border-b border-red-200"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Coffee size={28} className="text-red-900" />
            <div>
              <h1 className="text-2xl font-serif text-red-900">
                Bistro Classique
              </h1>
              <p className="text-[9px] tracking-[0.25em] text-red-800">
                EST. 1952
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-10">
            {["Home", "Menu", "About", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm tracking-wide text-red-900 hover:text-red-700 transition-colors relative group font-serif"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-900 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
          <div className="flex items-center space-x-6">
            <button className="hidden md:block text-red-900 hover:text-red-700 transition">
              <Search size={20} />
            </button>
            <button onClick={onCartClick} className="relative group">
              <ShoppingCart
                size={20}
                className="text-red-900 group-hover:text-red-700 transition"
              />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-900 text-amber-50 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50"
    >
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-900 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-800 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-flex items-center space-x-3 border-2 border-red-800 px-6 py-3 bg-amber-100/50 backdrop-blur-sm mb-8">
              <Award size={16} className="text-red-900" />
              <p className="text-xs tracking-[0.3em] text-red-900 font-serif">
                TRADITIONAL SINCE 1952
              </p>
            </div>
          </div>
          <h1
            className="text-7xl md:text-9xl font-serif text-red-900 mb-6 leading-tight animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Classic
            <br />
            <span className="text-red-800 italic">European</span>
            <br />
            Cuisine
          </h1>
          <p
            className="text-xl text-red-800 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up font-serif"
            style={{ animationDelay: "0.2s" }}
          >
            Timeless recipes passed down through generations
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <a
              href="#menu"
              className="group bg-red-900 text-amber-50 px-12 py-4 text-sm tracking-wider hover:bg-red-800 transition-all flex items-center space-x-2 font-serif"
            >
              <span>VIEW MENU</span>
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
            <a
              href="#reservations"
              className="group border-2 border-red-900 text-red-900 px-12 py-4 text-sm tracking-wider hover:bg-red-900 hover:text-amber-50 transition-all font-serif"
            >
              BOOK TABLE
            </a>
          </div>
          <div
            className="grid grid-cols-3 gap-8 mt-24 max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              { value: "70+", label: "Years" },
              { value: "Classic", label: "Recipes" },
              { value: "Family", label: "Owned" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-serif text-red-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-xs tracking-widest text-red-800">
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
      icon: <Coffee size={36} />,
      title: "Traditional Methods",
      description: "Recipes preserved from 1952, cooked the original way",
    },
    {
      icon: <Award size={36} />,
      title: "Family Heritage",
      description: "Three generations of culinary excellence",
    },
    {
      icon: <Utensils size={36} />,
      title: "Classic European",
      description: "Authentic French and Italian bistro favorites",
    },
  ];
  return (
    <section className="py-32 bg-red-900/10">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <p className="text-xs tracking-[0.3em] text-red-800 mb-4 font-serif">
            OUR HERITAGE
          </p>
          <h2 className="text-5xl font-serif text-red-900">
            Time-Honored Tradition
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="mb-6 text-red-900 inline-block transform group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-serif text-red-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-red-800 leading-relaxed">
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
    <div className="group bg-amber-50 border-2 border-red-200 overflow-hidden hover:shadow-xl hover:border-red-900 transition-all duration-500">
      <div className="relative h-72 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 sepia"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-50 via-amber-50/50 to-transparent" />
        {item.popular && (
          <div className="absolute top-4 left-4 bg-red-900 text-amber-50 px-4 py-1.5 text-xs tracking-wider font-serif">
            HOUSE FAVORITE
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-2xl font-serif text-red-900 mb-2">{item.name}</h3>
          <p className="text-sm text-red-800 mb-3">{item.description}</p>
          <div className="flex items-center space-x-3 text-xs text-red-700">
            <div className="flex items-center space-x-1">
              <Star size={14} className="fill-red-900 text-red-900" />
              <span className="text-red-900 font-semibold">{item.rating}</span>
            </div>
            <span>•</span>
            <span>{item.prepTime}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t-2 border-red-200">
          <span className="text-3xl font-serif text-red-900">
            ${item.price}
          </span>
          <button
            onClick={() => onAddToCart(item)}
            className="bg-red-900 text-amber-50 px-6 py-2.5 text-xs tracking-wider hover:bg-red-800 transition-all flex items-center space-x-2 font-serif"
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
    <section id="menu" className="py-32 bg-amber-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] text-red-800 mb-4 font-serif">
            OUR MENU
          </p>
          <h2 className="text-5xl font-serif text-red-900 mb-6">
            Classic Selections
          </h2>
          <p className="text-red-800 max-w-2xl mx-auto font-serif">
            Traditional European bistro favorites
          </p>
        </div>
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-700"
              size={18}
            />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-red-200 py-3 pl-12 pr-4 text-sm text-red-900 placeholder-red-700 focus:outline-none focus:border-red-900 transition-colors font-serif"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 text-xs tracking-wider transition-all font-serif ${
                selectedCategory === category
                  ? "bg-red-900 text-amber-50 shadow-lg"
                  : "border-2 border-red-200 text-red-900 hover:border-red-900"
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-50 border-2 border-red-200 w-full md:max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="bg-red-900 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-serif text-amber-50">Your Order</h2>
          <button
            onClick={onClose}
            className="text-amber-50 hover:text-amber-200 transition"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-96">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart size={48} className="mx-auto mb-4 text-red-300" />
              <p className="text-red-800 font-serif">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 border-b-2 border-red-200 pb-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover sepia"
                  />
                  <div className="flex-1">
                    <h3 className="font-serif text-red-900">{item.name}</h3>
                    <p className="text-sm text-red-800">${item.price}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-8 h-8 border-2 border-red-300 flex items-center justify-center hover:bg-red-100 text-red-900"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-red-900 font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                      className="w-8 h-8 bg-red-900 text-amber-50 flex items-center justify-center hover:bg-red-800"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-700 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t-2 border-red-200 p-6 bg-red-900/5">
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between text-red-800">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-800">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-800">
                <span>Delivery</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-serif pt-4 border-t-2 border-red-200 text-red-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-red-900 text-amber-50 py-4 text-sm tracking-wider hover:bg-red-800 transition-all font-serif"
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
    setOrderNumber(`BC${Date.now().toString().slice(-6)}`);
    setOrderPlaced(true);
  };
  if (!isOpen) return null;
  if (orderPlaced) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-amber-50 border-2 border-red-200 max-w-md w-full p-12 text-center animate-scale-in">
          <div className="w-20 h-20 bg-red-900 mx-auto flex items-center justify-center mb-6">
            <Check size={40} className="text-amber-50" />
          </div>
          <h2 className="text-3xl font-serif text-red-900 mb-2">
            Order Confirmed!
          </h2>
          <p className="text-red-800 mb-8 font-serif">Order #{orderNumber}</p>
          <button
            onClick={() => {
              setOrderPlaced(false);
              setStep(1);
              onClose();
            }}
            className="bg-red-900 text-amber-50 px-8 py-3 text-sm tracking-wider hover:bg-red-800 transition font-serif"
          >
            CONTINUE
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-50 border-2 border-red-200 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-red-900 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-serif text-amber-50">Checkout</h2>
          <button
            onClick={onClose}
            className="text-amber-50 hover:text-amber-200"
          >
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
                className="w-full bg-white border-2 border-red-200 px-4 py-3 text-sm text-red-900 placeholder-red-700 focus:outline-none focus:border-red-900 font-serif"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                className="w-full bg-white border-2 border-red-200 px-4 py-3 text-sm text-red-900 placeholder-red-700 focus:outline-none focus:border-red-900 font-serif"
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone"
                className="w-full bg-white border-2 border-red-200 px-4 py-3 text-sm text-red-900 placeholder-red-700 focus:outline-none focus:border-red-900 font-serif"
              />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Address"
                rows="3"
                className="w-full bg-white border-2 border-red-200 px-4 py-3 text-sm text-red-900 placeholder-red-700 focus:outline-none focus:border-red-900 resize-none font-serif"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="bg-white border-2 border-red-200 px-4 py-3 text-sm text-red-900 placeholder-red-700 focus:outline-none focus:border-red-900 font-serif"
                />
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="ZIP"
                  className="bg-white border-2 border-red-200 px-4 py-3 text-sm text-red-900 placeholder-red-700 focus:outline-none focus:border-red-900 font-serif"
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <label className="flex items-center border-2 border-red-200 p-4 cursor-pointer hover:bg-red-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <span className="text-sm text-red-900 font-serif">
                  Cash on Delivery
                </span>
              </label>
              <label className="flex items-center border-2 border-red-200 p-4 cursor-pointer hover:bg-red-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <span className="text-sm text-red-900 font-serif">
                  Credit Card
                </span>
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="border-2 border-red-200 p-6 bg-white">
              <h3 className="font-serif text-xl mb-4 text-red-900">
                Order Summary
              </h3>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm mb-2 text-red-800"
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t-2 border-red-200 mt-4 pt-4 flex justify-between font-serif text-xl text-red-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="border-t-2 border-red-200 p-6 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="border-2 border-red-200 px-6 py-3 text-xs tracking-wider hover:border-red-900 text-red-900 font-serif"
            >
              BACK
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="ml-auto bg-red-900 text-amber-50 px-6 py-3 text-xs tracking-wider hover:bg-red-800 font-serif"
            >
              NEXT
            </button>
          ) : (
            <button
              onClick={handlePlaceOrder}
              className="ml-auto bg-red-900 text-amber-50 px-6 py-3 text-xs tracking-wider hover:bg-red-800 font-serif"
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
    <section id="about" className="py-32 bg-red-900/10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">
          <div>
            <p className="text-xs tracking-[0.3em] text-red-800 mb-4 font-serif">
              OUR HISTORY
            </p>
            <h2 className="text-5xl font-serif text-red-900 mb-8">
              A Family Legacy
            </h2>
            <p className="text-red-800 mb-6 leading-relaxed">
              Since 1952, Bistro Classique has been serving authentic European
              cuisine to our community. Started by our grandparents, we've
              preserved their original recipes and traditional cooking methods.
            </p>
            <p className="text-red-800 leading-relaxed">
              Three generations later, we continue their commitment to quality,
              authenticity, and warm hospitality.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=500&fit=crop"
              alt="Restaurant"
              className="w-full h-64 object-cover sepia border-2 border-red-200"
            />
            <img
              src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&h=500&fit=crop"
              alt="Chef"
              className="w-full h-64 object-cover mt-12 sepia border-2 border-red-200"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  return (
    <section id="contact" className="py-32 bg-amber-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] text-red-800 mb-4 font-serif">
            VISIT US
          </p>
          <h2 className="text-5xl font-serif text-red-900">Get In Touch</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {[
            {
              icon: <MapPin size={28} />,
              title: "Location",
              info: "789 Heritage Lane\nOld Town, OT 22334",
            },
            {
              icon: <Clock size={28} />,
              title: "Hours",
              info: "Tue - Sun\n11:00 AM - 10:00 PM",
            },
            {
              icon: <Phone size={28} />,
              title: "Reserve",
              info: "+1 (555) 222-3344\nbistro@classique.com",
            },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-red-900 mb-4 inline-block">{item.icon}</div>
              <h3 className="text-xl font-serif mb-3 text-red-900">
                {item.title}
              </h3>
              <p className="text-sm text-red-800 whitespace-pre-line leading-relaxed">
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
    <footer className="bg-red-900/10 border-t-2 border-red-200 py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <Coffee size={48} className="mx-auto mb-4 text-red-900" />
          <h3 className="text-2xl font-serif text-red-900 mb-2">
            Bistro Classique
          </h3>
          <p className="text-xs text-red-800 tracking-[0.3em]">EST. 1952</p>
        </div>
        <div className="text-center text-sm text-red-700">
          <p>© 2024 Bistro Classique. All rights reserved.</p>
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
      <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fade-in { animation: fade-in 0.5s ease-out; } .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; } .animate-scale-in { animation: scale-in 0.3s ease-out; } .sepia { filter: sepia(0.3); }`}</style>
      <LoadingScreen isLoading={isLoading} />
      {!isLoading && (
        <div className="min-h-screen bg-amber-50">
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
