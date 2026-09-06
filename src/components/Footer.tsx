import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="site-footer mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="site-footer-brand text-lg mb-4">YOUR_STORE</h3>
            <p className="text-sm">Your destination for trendy fashion at affordable prices.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="transition-colors">New Arrivals</a></li>
              <li><a href="#" className="transition-colors">All Products</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => window.location.hash = '#contact-us'} className="transition-colors">Contact Us</button></li>
              <li><button onClick={() => window.location.hash = '#orders'} className="transition-colors">My Orders</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-sm mb-4">Subscribe for exclusive deals and updates</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="newsletter-input flex-1 px-3 py-2 rounded text-sm"
              />
              <button className="px-4 py-2 btn-primary rounded">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">&copy; 2025 YOUR_STORE. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button className="icon-btn" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </button>
            <button className="icon-btn" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </button>
            <button className="icon-btn" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
