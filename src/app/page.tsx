import Image from "next/image";
import Link from "next/link";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Utensils, Camera, Users, Award } from "lucide-react";
import Header from "../components/layout/header";
import Footer from "../components/layout/footer";
import { PlaceHolderImages } from "../lib/placeholder-images";

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === "hero-image-main");

  const features = [
    {
      icon: <Utensils className="h-10 w-10 text-primary" />,
      title: "Discover Recipes",
      description:
        "Explore thousands of recipes from around the world, contributed by a vibrant community of food lovers.",
    },
    {
      icon: <Camera className="h-10 w-10 text-primary" />,
      title: "Share Your Creations",
      description:
        "Upload photos and videos of your culinary masterpieces and inspire others with your unique touch.",
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Join the Community",
      description:
        "Connect with fellow foodies, exchange tips, and build your culinary network.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-accent">
                Welcome to <span className="text-primary">GourmetHub</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                The ultimate destination for food enthusiasts. Discover, create,
                and share delicious recipes with a passionate community. Your
                next favorite meal is just a click away.
              </p>
              <div className="flex space-x-4">
                <Button asChild size="lg">
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/signin">Sign In</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-80 lg:h-full rounded-lg overflow-hidden shadow-2xl">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  style={{ objectFit: "cover" }}
                  className="transform hover:scale-105 transition-transform duration-500 ease-in-out"
                  data-ai-hint={heroImage.imageHint}
                  priority
                />
              )}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-headline font-bold text-accent mb-12">
              Why You'll Love GourmetHub
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="bg-background border-none shadow-lg transform hover:-translate-y-2 transition-transform duration-300"
                >
                  <CardHeader className="items-center">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline text-2xl text-accent">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
