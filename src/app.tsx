import { FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Plus, Search, FileDown, MoreHorizontal, Filter } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Header } from './components/header';
import { Tabs } from './components/tabs';
import { Button } from './components/ui/button';
import { Control, Input } from './components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
import { Pagination } from './components/pagination';
import { TagResponse } from './models/tag-response';
import { useDebounceValue } from './hooks/use-debounce-value';
import { CreateTagForm } from './components/create-tag-form';

export function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page')
    ? Number(searchParams.get('page'))
    : 1;
  const filterParam = searchParams.get('filter') ?? '';
  const perPageParam = searchParams.get('per_page') ?? '10';

  const [filter, setFilter] = useState(filterParam);
  const debouncedFilter = useDebounceValue<string>(filter, 1000);

  const { data: tagsResponse, isLoading } = useQuery<TagResponse>({
    queryKey: ['get-tags', pageParam, filterParam, perPageParam],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:3333/tags?_page=${pageParam}&_per_page=${perPageParam}&title=${filterParam}`
      );
      const data = await response.json();
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60 * 24, // 1 dia
  });

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams((params) => {
      params.set('page', '1');
      params.set('filter', debouncedFilter);
      return params;
    });
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className="py-10 space-y-8">
      <div>
        <Header />
        <Tabs />
      </div>

      <main className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Tags</h1>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button variant="primary">
                <Plus className="size-3" /> Create new
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/70" />
              <Dialog.Content className="fixed p-10 right-0 top-0 bottom-0 h-screen min-w-[320px] space-y-10 z-10 bg-zinc-950 border-zinc-900">
                <div className="space-y-3">
                  <Dialog.Title className="text-xl font-bold">
                    Create tag
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-zinc-500">
                    Tags can be used to group videos about similar concepts
                  </Dialog.Description>
                </div>

                <CreateTagForm />
                <Dialog.Close />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <div className="flex items-center justify-between">
          <form onSubmit={onFilter} className="flex items-center gap-2">
            <Input variant="filter">
              <Search className="size-3" />
              <Control
                placeholder="Search tags..."
                onChange={(e) => setFilter(e.target.value)}
                value={filter}
              />
            </Input>

            <Button type="submit">
              <Filter className="size-3" />
              Filter
            </Button>
          </form>

          <Button>
            <FileDown className="size-3" />
            Export
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Amount of videos</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tagsResponse?.data.map((tag, index) => (
              <TableRow key={tag.id ?? index}>
                <TableCell></TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{tag.title}</span>
                    <span className="text-xs text-zinc-500">{tag.slug}</span>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {tag.amountOfVideos} video(s)
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {tagsResponse && (
          <Pagination
            pages={tagsResponse.pages}
            items={tagsResponse.items}
            page={pageParam}
          />
        )}
      </main>
    </div>
  );
}
