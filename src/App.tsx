import { useState, useEffect } from "react";
import { Navbar, type Tab } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HomePage } from "@/pages/HomePage";
import { ShopPage } from "@/pages/ShopPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { CartCheckoutPage } from "@/pages/CartCheckoutPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AdminPage } from "@/pages/AdminPage";
import { TokoPage } from "@/pages/TokoPage";
import { CourierPage } from "@/pages/CourierPage";
import { MyOrdersPage } from "@/pages/MyOrdersPage";
import { ChatPage } from "@/pages/ChatPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProductsProvider, useProducts } from "@/context/ProductsContext";
import type { Product } from "@/data/products";

function AppContent() {
  const [tab, setTab] = useState<Tab>("home");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const { profile, loading: authLoading } = useAuth();
  const { loading: productsLoading, refetch } = useProducts();

  useEffect(() => {
    const handleLogout = () => setTab("home");
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  useEffect(() => {
    if (profile && !profile.approved) {
      setTab("login");
    }
  }, [profile]);

  const openProduct = (p: Product) => {
    setActiveProduct(p);
    setTab("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeTab = (t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (t === "toko" || t === "admin" || t === "shop" || t === "my-orders") refetch();
  };

  if (authLoading || productsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    );
  }

  const isAuthPage = tab === "login" || tab === "register";
  const isAdminPage = tab === "admin" && profile?.role === "admin";
  const isTokoPage = tab === "toko" && profile?.role === "toko";
  const isCourierPage = tab === "courier" && profile?.role === "courier";
  const isMyOrdersPage = tab === "my-orders" && profile?.approved;

  if (isAuthPage) {
    return (
      <>
        <Navbar active={tab} onTabChange={changeTab} />
        <main className="flex-1">
          {tab === "login" && <LoginPage onTabChange={changeTab} />}
          {tab === "register" && <RegisterPage onTabChange={changeTab} />}
        </main>
        <Footer onTabChange={changeTab} />
      </>
    );
  }

  if (isAdminPage) {
    return (
      <>
        <Navbar active={tab} onTabChange={changeTab} />
        <main className="flex-1">
          <AdminPage onTabChange={changeTab} />
        </main>
        <Footer onTabChange={changeTab} />
      </>
    );
  }

  if (isTokoPage) {
    return (
      <>
        <Navbar active={tab} onTabChange={changeTab} />
        <main className="flex-1">
          <TokoPage onTabChange={changeTab} />
        </main>
        <Footer onTabChange={changeTab} />
      </>
    );
  }

  if (isCourierPage) {
    return (
      <>
        <Navbar active={tab} onTabChange={changeTab} />
        <main className="flex-1">
          <CourierPage onTabChange={changeTab} />
        </main>
        <Footer onTabChange={changeTab} />
      </>
    );
  }

  if (tab === "chat" && profile) {
    return (
      <>
        <Navbar active={tab} onTabChange={changeTab} />
        <main className="flex-1">
          <ChatPage onTabChange={changeTab} />
        </main>
        <Footer onTabChange={changeTab} />
      </>
    );
  }

  if (tab === "profile" && profile?.approved) {
    return (
      <>
        <Navbar active={tab} onTabChange={changeTab} />
        <main className="flex-1">
          <ProfilePage onTabChange={changeTab} />
        </main>
        <Footer onTabChange={changeTab} />
      </>
    );
  }

  if (isMyOrdersPage) {
    return (
      <>
        <Navbar active={tab} onTabChange={changeTab} />
        <main className="flex-1">
          <MyOrdersPage onTabChange={changeTab} />
        </main>
        <Footer onTabChange={changeTab} />
      </>
    );
  }

  return (
    <>
      <Navbar active={tab} onTabChange={changeTab} />
      <main className="flex-1">
        {tab === "home" && <HomePage onTabChange={changeTab} onOpenProduct={openProduct} />}
        {tab === "shop" && <ShopPage onOpenProduct={openProduct} />}
        {tab === "product" && activeProduct && (
          <ProductDetailPage
            product={activeProduct}
            onTabChange={changeTab}
            onOpenProduct={openProduct}
          />
        )}
        {tab === "cart" && <CartCheckoutPage onTabChange={changeTab} />}
      </main>
      <Footer onTabChange={changeTab} />
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <ProductsProvider>
          <div className="flex min-h-screen flex-col bg-slate-50">
            <AppContent />
          </div>
        </ProductsProvider>
      </AuthProvider>
    </CartProvider>
  );
}

export default App;
