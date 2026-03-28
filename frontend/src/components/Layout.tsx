import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import NavigationLoadingBar from "./NavigationLoadingBar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    document.title = "Bluemoon clothing";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationLoadingBar />
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Layout;
