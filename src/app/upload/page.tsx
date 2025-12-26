import Header from '../../components/layout/header';
import Footer from '../../components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import UploadForm from '../../components/forms/upload-form';

export default function UploadPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-accent">Share Your Creation</CardTitle>
            <CardDescription>Upload images and a short video of your dish. Let the world see your talent!</CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
