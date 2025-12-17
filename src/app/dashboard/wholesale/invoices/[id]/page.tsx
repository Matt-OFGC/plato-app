interface InvoicePageProps {
  params: { id: string };
}

export default function InvoicePage({ params }: InvoicePageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Invoice {params.id}</h1>
      <p className="text-gray-600 mt-2">Placeholder invoice page.</p>
    </div>
  );
}
