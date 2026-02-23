import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center w-full bg-background py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
