import { Layout } from './components/Layout';
import { useRoute } from './lib/router';
import { HomePage } from './pages/HomePage';
import { NotebookPage } from './pages/NotebookPage';
import { ProgressPage } from './pages/ProgressPage';
import { ReviewPage } from './pages/ReviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { UnitPage } from './pages/UnitPage';

export function App() {
  const [section = '', ...rest] = useRoute();
  let page;
  switch (section) {
    case 'unit':
      page = <UnitPage key={rest[0]} unitId={rest[0]} tab={rest[1]} />;
      break;
    case 'review':
      page = <ReviewPage />;
      break;
    case 'notebook':
      page = <NotebookPage />;
      break;
    case 'progress':
      page = <ProgressPage />;
      break;
    case 'settings':
      page = <SettingsPage />;
      break;
    default:
      page = <HomePage />;
  }
  return <Layout section={section === 'unit' ? '' : section}>{page}</Layout>;
}
