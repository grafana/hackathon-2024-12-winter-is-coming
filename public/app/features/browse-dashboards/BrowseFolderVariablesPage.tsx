import { useMemo } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { CellProps, Button, Column, InteractiveTable, Stack } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { buildNavModel, getVariablesTabID } from 'app/features/folders/state/navModel';

import { useGetFolderQuery, useSaveFolderMutation } from './api/browseDashboardsAPI';
import { FolderActionsButton } from './components/FolderActionsButton';

type Variable = {
  id: string;
  uid: string;
  name: string;
  value?: string;
  description?: string;
  scope?: string;
  scope_id?: string;
  type?: string;
};

type Cell<T extends keyof Variable = keyof Variable> = CellProps<Variable, Variable[T]>;

export function BrowseFolderVariablesPage() {
  const { uid: folderUID = '' } = useParams();
  const { data: folderDTO } = useGetFolderQuery(folderUID);
  const [saveFolder] = useSaveFolderMutation();

  const navModel = useMemo(() => {
    if (!folderDTO) {
      return undefined;
    }
    const model = buildNavModel(folderDTO);

    // Set the "Alerting" tab to active
    const variablesTabID = getVariablesTabID(folderDTO.uid);
    const alertingTab = model.children?.find((child) => child.id === variablesTabID);
    if (alertingTab) {
      alertingTab.active = true;
    }
    return model;
  }, [folderDTO]);

  const onEditTitle = folderUID
    ? async (newValue: string) => {
        if (folderDTO) {
          const result = await saveFolder({
            ...folderDTO,
            title: newValue,
          });
          if ('error' in result) {
            throw result.error;
          }
        }
      }
    : undefined;
  const variables: Variable[] =
    folderDTO?.id === 1
      ? [
          {
            id: '1',
            uid: crypto.randomUUID(),
            name: 'folder1 foo',
            value: 'foo value',
            description: 'something about foo',
          },
          {
            id: '2',
            uid: crypto.randomUUID(),
            name: 'folder1 bar',
            value: 'bar value',
            description: 'something about bar',
          },
          {
            id: '3',
            uid: crypto.randomUUID(),
            name: 'folder1 baz',
            value: 'baz value',
            description: 'something about baz',
          },
        ]
      : [
          {
            id: '1',
            uid: crypto.randomUUID(),
            name: 'var from folder 2',
            value: 'value of folder 2 var',
            description: 'something about folder 2 variable',
          },
        ];
  const columns: Array<Column<Variable>> = useMemo(
    () => [
      { id: 'name', header: 'name', cell: ({ cell: { value } }: Cell<'name'>) => value && <>{value.toUpperCase()}</> },
      { id: 'value', header: 'value', cell: ({ cell: { value } }: Cell<'value'>) => value && <>{value}</> },
      {
        id: 'description',
        header: 'description',
        cell: ({ cell: { value } }: Cell<'description'>) => value && <>{value}</>,
      },
      {
        id: 'scope',
        header: 'scope',
        cell: ({ cell: { value } }: Cell<'scope'>) => <>{'folder'}</>,
      },
      {
        id: 'scope_id',
        header: 'scope_id',
        cell: ({ cell: { value } }: Cell<'scope_id'>) => <>{folderDTO?.id || +`folder id : ${folderDTO?.id}`}</>,
      },
      { id: 'type', header: 'type', cell: ({ cell: { value } }: Cell<'name'>) => <>{value || 'constant'}</> },
      {
        id: 'edit',
        header: '',
        cell: ({ row: { original } }: Cell) => {
          return (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {}}
              icon="pen"
              aria-label={`Edit variable ${original.name}`}
            />
          );
        },
      },
      {
        id: 'delete',
        header: '',
        cell: ({ row: { original } }: Cell) => {
          return (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {}}
              icon="times"
              aria-label={`Delete variable ${original.name}`}
            />
          );
        },
      },
    ],
    [folderDTO]
  );
  return (
    <Page
      navId="dashboards/browse"
      pageNav={navModel}
      onEditTitle={onEditTitle}
      actions={<>{folderDTO && <FolderActionsButton folder={folderDTO} />}</>}
    >
      <Page.Contents>
        <Stack direction={'column'} gap={0.5}>
          <Stack>
            <Button variant="primary" icon={'plus-square'} size="sm">
              Add new variable
            </Button>
          </Stack>
          <InteractiveTable columns={columns} data={variables} getRowId={(v) => v.uid}></InteractiveTable>
        </Stack>
      </Page.Contents>
    </Page>
  );
}

export default BrowseFolderVariablesPage;
