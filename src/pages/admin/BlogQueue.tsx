import { AdminLayout } from "@/components/admin/AdminLayout";
import { BlogQueueManager } from "@/components/admin/BlogQueueManager";
import { Helmet } from 'react-helmet-async';

const BlogQueue = () => {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coda Articoli Automatica</h1>
          <p className="text-muted-foreground mt-2">
            Programma la generazione automatica di articoli con traduzioni e link building
          </p>
        </div>
        
        <BlogQueueManager />
      </div>
    </AdminLayout>
    </>
  );
};

export default BlogQueue;
