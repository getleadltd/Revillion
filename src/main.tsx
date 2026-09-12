import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element');

const hasStaticBlogSnapshot = document.getElementById('revillion-blog-bootstrap') !== null;

if (hasStaticBlogSnapshot) {
  // Keep the crawlable snapshot visible while the route chunk downloads. Once
  // ready, pass the resolved component into App so Suspense never commits a
  // loading-only frame over the server-generated article.
  import('./pages/BlogPost')
    .then(({ default: BlogPost }) => {
      createRoot(rootElement).render(
        <App
          initialBlogPostComponent={BlogPost}
          disableInitialRouteAnimation
        />,
      );
    })
    .catch((error: unknown) => {
      console.error('Could not activate the static blog article', error);
    });
} else {
  createRoot(rootElement).render(<App />);
}
