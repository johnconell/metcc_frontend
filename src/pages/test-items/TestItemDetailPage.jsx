import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { testItemApi } from '../../api/testItemApi';
import { formatDate } from '../../utils/formatDate';
import { Button } from '../../components/ui/Button';

export default function TestItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    testItemApi.get(id).then(({ data }) => setItem(data.data));
  }, [id]);

  if (!item) return <p>Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">{item.title}</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <dl className="space-y-2 text-sm">
          <div><dt className="font-medium">Description</dt><dd>{item.description || '-'}</dd></div>
          <div><dt className="font-medium">Status</dt><dd>{item.status}</dd></div>
          <div><dt className="font-medium">Created By</dt><dd>{item.created_by?.name || '-'}</dd></div>
          <div><dt className="font-medium">Created</dt><dd>{formatDate(item.created_at)}</dd></div>
          <div><dt className="font-medium">Updated</dt><dd>{formatDate(item.updated_at)}</dd></div>
        </dl>
        <Link to={`/test-items/${id}/edit`} className="mt-4 inline-block"><Button>Edit</Button></Link>
      </div>
    </div>
  );
}
