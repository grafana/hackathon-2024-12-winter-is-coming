import { useEffect, useState, useMemo } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { config } from '@grafana/runtime';
import {
  CollapsableSection,
  Button,
  EmptyState,
  FileDropzone,
  Drawer,
  Stack,
  InlineLabel,
  Input,
  Select,
  InteractiveTable,
  Column,
  CellProps,
  Modal,
  Tab,
  TabContent,
  TabsBar,
  InlineFormLabel,
  Icon,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import type { StoreState } from 'app/types';

type Cell<T extends keyof Variable = keyof Variable> = CellProps<Variable, Variable[T]>;
type VarGroupCell<T extends keyof VariableGroup = keyof VariableGroup> = CellProps<VariableGroup, VariableGroup[T]>;

function mapStateToProps(state: StoreState) {
  return {};
}
const mapDispatchToProps = {};

export interface State {}
export interface OwnProps {}
export type Props = OwnProps & ConnectedProps<typeof connector>;

const connector = connect(mapStateToProps, mapDispatchToProps);

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

type VariableGroup = {
  var_name: string;
  dev: string;
  staging: string;
  prod: string;
  add_more?: any;
};

export const VariablesListPage = (props: Props) => {
  let [activeTab, setActiveTab] = useState<'variables' | 'variables-group'>('variables');
  let [variables, setVariables] = useState<Variable[]>([]);
  let [showNewVariable, setShowNewVariable] = useState(false);
  let [showBulkImport, setShowBulkImport] = useState(false);
  let [showBulkImportContent, setShowBulkImportContent] = useState('');
  let [showBulkImportBtn, setShowBulkImportBtn] = useState(false);
  let [showConfirmDelete, setShowConfirmDelete] = useState(false);
  let [mode, setMode] = useState<'new' | 'edit'>('new');
  let [uid, setUid] = useState('');
  let [name, setName] = useState('');
  let [description, setDesc] = useState('');
  let [value, setValue] = useState('');
  let [varType, setVarType] = useState('constant');

  const getVariables = () => {
    fetch('/api/variables').then(async (res) => {
      let vars = await res.json();
      setVariables(
        vars.filter((c: any) => {
          console.log(c);
          return c.scope_id === config.bootData.user.orgId + '';
        })
      );
    });
  };
  const createNewVariable = () => {
    fetch(`/api/variables?name=${name.toUpperCase().replaceAll(' ', '_')}&description=${description}&value=${value}`, {
      method: 'POST',
    })
      .then(async (res) => {
        const data = await res.json();
        setVariables([...variables, data]);
      })
      .catch((ex) => {
        console.error(ex);
      })
      .finally(() => {
        setName('');
        setDesc('');
        setVarType('constant');
        setValue('');
        setShowNewVariable(false);
      });
  };
  const updateVariable = () => {
    fetch(`/api/variables/uid/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, uid, description, value, type: varType }),
    })
      .catch((ex) => {
        console.error(ex);
      })
      .finally(() => {
        setName('');
        setDesc('');
        setVarType('constant');
        setValue('');
        setShowNewVariable(false);
        window.location.reload();
      });
  };
  const deleteVariable = () => {
    fetch(`/api/variables/uid/${uid}`, { method: 'DELETE' })
      .catch((ex) => {
        console.error(ex);
      })
      .finally(() => {
        setName('');
        setDesc('');
        setVarType('constant');
        setValue('');
        setShowConfirmDelete(false);
        window.location.reload();
      });
  };
  useEffect(() => {
    getVariables();
  }, []);
  const columns: Array<Column<Variable>> = useMemo(
    () => [
      { id: 'name', header: 'name', cell: ({ cell: { value } }: Cell<'name'>) => value && <>{value}</> },
      { id: 'value', header: 'value', cell: ({ cell: { value } }: Cell<'value'>) => value && <>{value}</> },
      {
        id: 'description',
        header: 'description',
        cell: ({ cell: { value } }: Cell<'description'>) => value && <>{value}</>,
      },
      {
        id: 'scope',
        header: 'scope',
        cell: ({ cell: { value } }: Cell<'scope'>) => value && <>{value}</>,
      },
      {
        id: 'scope_id',
        header: 'scope_id',
        cell: ({ cell: { value } }: Cell<'scope_id'>) =>
          value && <>{config.bootData.user.orgName.toString() + ' ' + `(id : ${value})`}</>,
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
              onClick={() => {
                setMode('edit');
                setUid(original.uid);
                setName(original.name);
                setDesc(original.description || '');
                setValue(original.value || '');
                setShowNewVariable(true);
              }}
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
              onClick={() => {
                setUid(original.uid);
                setName(original.name);
                setShowConfirmDelete(true);
              }}
              icon="times"
              aria-label={`Delete variable ${original.name}`}
            />
          );
        },
      },
    ],
    []
  );
  const variables_group: Array<Column<VariableGroup>> = useMemo(
    () => [
      {
        id: 'var_name',
        header: 'var_name',
        cell: ({ cell: { value } }: VarGroupCell<'var_name'>) =>
          value && (
            <>
              {value === 'ADD_MORE' ? (
                <Stack gap={1}>
                  <Button icon="plus" variant="secondary">
                    Add variable
                  </Button>
                  <Button icon="plus" variant="secondary">
                    Add environment
                  </Button>
                </Stack>
              ) : (
                <>
                  {value}
                  <Icon name="pen" style={{ marginInline: '10px' }} />
                </>
              )}
            </>
          ),
      },
      {
        id: 'dev',
        header: 'dev',
        cell: ({ cell: { value } }: VarGroupCell<'dev'>) =>
          value && (
            <>
              {value}
              <Icon name="pen" style={{ marginInline: '10px' }} />
            </>
          ),
      },
      {
        id: 'staging',
        header: 'staging',
        cell: ({ cell: { value } }: VarGroupCell<'staging'>) =>
          value && (
            <>
              {value}
              <Icon name="pen" style={{ marginInline: '10px' }} />
            </>
          ),
      },
      {
        id: 'prod',
        header: 'prod',
        cell: ({ cell: { value } }: VarGroupCell<'prod'>) =>
          value && (
            <>
              {value}
              <Icon name="pen" style={{ marginInline: '10px' }} />
            </>
          ),
      },
    ],
    []
  );
  const variable_groups: VariableGroup[] = [
    { var_name: 'APPLICATION_ID', dev: 'my-dev-app', staging: 'my-staging-app', prod: 'my-prod-app' },
    { var_name: 'DATABASE_NAME', dev: 'dev01', staging: 'staging-xyz', prod: 'prod-db-0034' },
    { var_name: 'ADD_MORE', dev: '', staging: '', prod: '' },
  ];
  return (
    <Page
      navId="variables"
      actions={
        variables.length > 0
          ? [
              [
                <Button
                  icon="file-edit-alt"
                  variant="secondary"
                  onClick={() => {
                    setShowBulkImport(true);
                  }}
                >
                  Bulk import via file
                </Button>,
                <Button
                  icon={'x'}
                  onClick={() => {
                    setMode('new');
                    setShowNewVariable(true);
                  }}
                >
                  Add new variable
                </Button>,
              ],
            ]
          : []
      }
    >
      <TabsBar>
        <Tab label="Variables" active={activeTab === 'variables'} onChangeTab={() => setActiveTab('variables')} />
        <Tab
          label="Variables Group"
          active={activeTab === 'variables-group'}
          onChangeTab={() => setActiveTab('variables-group')}
        />
      </TabsBar>
      <TabContent>
        <br />
        {activeTab === 'variables' && (
          <>
            <Modal
              title={
                <>
                  Delete variable&nbsp;<b>{name}?</b>
                </>
              }
              isOpen={showConfirmDelete}
              onDismiss={() => setShowConfirmDelete(false)}
            >
              <Stack gap={1}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowConfirmDelete(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteVariable();
                  }}
                >
                  Delete
                </Button>
              </Stack>
            </Modal>
            {showNewVariable ? (
              <Drawer
                title={mode === 'edit' ? 'Edit variable' : 'Add new variable'}
                size="md"
                onClose={() => setShowNewVariable(false)}
              >
                <Stack direction={'column'} gap={0.5}>
                  {mode === 'edit' ? (
                    <Stack gap={0.5}>
                      <InlineLabel width={20} tooltip={'UID'}>
                        UID
                      </InlineLabel>
                      <Input value={uid} disabled />
                    </Stack>
                  ) : (
                    <></>
                  )}
                  <Stack gap={0.5}>
                    <InlineLabel width={20} tooltip={'Name of the variable'}>
                      Name
                    </InlineLabel>
                    <Input value={name} onChange={(e) => setName(e.currentTarget.value)} />
                  </Stack>
                  <Stack gap={0.5}>
                    <InlineLabel width={20} tooltip={'Value for the variable'}>
                      Value
                    </InlineLabel>
                    <Input value={value} onChange={(e) => setValue(e.currentTarget.value)} />
                  </Stack>
                  <Stack gap={0.5}>
                    <InlineLabel width={20} tooltip={'Description about the variable'}>
                      Description
                    </InlineLabel>
                    <Input value={description} onChange={(e) => setDesc(e.currentTarget.value)} />
                  </Stack>
                  <Stack gap={0.5}>
                    <InlineLabel width={20} tooltip={'Type of the variable'}>
                      Type
                    </InlineLabel>
                    <Select
                      value={varType}
                      options={[{ value: 'constant', label: 'Constant' }]}
                      onChange={(e) => setVarType(e.value || '')}
                    />
                  </Stack>
                  <br />
                  <Stack alignItems={'center'} justifyContent={'center'}>
                    {mode === 'new' ? (
                      <Button
                        icon={'save'}
                        onClick={() => {
                          createNewVariable();
                        }}
                      >
                        Submit
                      </Button>
                    ) : (
                      <Button
                        icon={'edit'}
                        onClick={() => {
                          updateVariable();
                        }}
                      >
                        Update
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Drawer>
            ) : (
              <></>
            )}
            {showBulkImport ? (
              <Modal
                title={'Import variable'}
                isOpen={showBulkImport}
                onDismiss={() => {
                  setShowBulkImport(false);
                }}
              >
                <Stack direction="column">
                  <FileDropzone
                    onLoad={(e) => {
                      setShowBulkImportContent(e?.toString() || '');
                      setShowBulkImportBtn(true);
                    }}
                  ></FileDropzone>
                  {showBulkImportBtn ? (
                    <Button
                      onClick={(e) => {
                        setShowBulkImport(false);
                        let newVariables = showBulkImportContent
                          .split('\n')
                          .filter((v) => v.includes('='))
                          .map((v) => {
                            let vals = v.split('=');
                            let variable: Variable = {
                              id: '1',
                              uid: crypto.randomUUID(),
                              name: vals[0],
                              value: vals[1],
                              scope: 'org',
                              scope_id: config.bootData.user.orgId + '',
                            };
                            return variable;
                          });
                        setVariables([...variables, ...newVariables]);
                      }}
                    >
                      Import variables
                    </Button>
                  ) : (
                    <></>
                  )}
                </Stack>
              </Modal>
            ) : (
              <></>
            )}
            {variables.length > 0 ? (
              <InteractiveTable columns={columns} data={variables} getRowId={(v) => v.uid}></InteractiveTable>
            ) : (
              <EmptyState
                variant="call-to-action"
                button={
                  <>
                    <Stack>
                      <Button
                        icon="file-edit-alt"
                        variant="secondary"
                        onClick={() => {
                          setShowBulkImport(true);
                        }}
                        size="md"
                      >
                        Bulk import from file
                      </Button>
                      <Button
                        icon="x"
                        onClick={() => {
                          setMode('new');
                          setShowNewVariable(true);
                        }}
                        size="md"
                      >
                        Add new variable
                      </Button>
                    </Stack>
                  </>
                }
                message={'Grafana Global Variables'}
              >
                Note: You can also define variables via <b>PROVISIONING</b>
              </EmptyState>
            )}
          </>
        )}
        {activeTab === 'variables-group' && (
          <>
            <CollapsableSection label="➡️ Databases" isOpen={false}>
              <Stack direction={'column'}>
                <Stack>
                  <InlineFormLabel>Context Name</InlineFormLabel>
                  <Input value="environment" />
                </Stack>
                <Stack>
                  <InteractiveTable
                    columns={variables_group}
                    data={variable_groups}
                    getRowId={(_, i) => i.toString()}
                  ></InteractiveTable>
                </Stack>
              </Stack>
            </CollapsableSection>
            <CollapsableSection label="➡️ Environments" isOpen={true}>
              <Stack direction={'column'}>
                <Stack>
                  <InlineFormLabel>Context Name</InlineFormLabel>
                  <Input value="environment" />
                </Stack>
                <Stack>
                  <InteractiveTable
                    columns={variables_group}
                    data={variable_groups}
                    getRowId={(_, i) => i.toString()}
                  ></InteractiveTable>
                </Stack>
              </Stack>
            </CollapsableSection>
            <CollapsableSection label="➡️ Applications" isOpen={false}>
              <Stack direction={'column'}>
                <Stack>
                  <InlineFormLabel>Context Name</InlineFormLabel>
                  <Input value="environment" />
                </Stack>
                <Stack>
                  <InteractiveTable
                    columns={variables_group}
                    data={variable_groups}
                    getRowId={(_, i) => i.toString()}
                  ></InteractiveTable>
                </Stack>
              </Stack>
            </CollapsableSection>
            <Stack justifyContent={'center'} alignItems={'center'}>
              <Button variant="primary" icon="plus">
                Add more variable group
              </Button>
            </Stack>
          </>
        )}
      </TabContent>
    </Page>
  );
};

export default connector(VariablesListPage);
