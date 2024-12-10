import { Fragment, useState, useMemo } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { useMount } from 'react-use';

import { PluginExtensionComponent, PluginExtensionPoints } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { usePluginComponentExtensions, config } from '@grafana/runtime';
import { Tab, TabsBar, TabContent, Stack, Button, InteractiveTable, Column, CellProps } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import SharedPreferences from 'app/core/components/SharedPreferences/SharedPreferences';
import { useQueryParams } from 'app/core/hooks/useQueryParams';
import { t } from 'app/core/internationalization';
import { StoreState } from 'app/types';

import UserOrganizations from './UserOrganizations';
import UserProfileEditForm from './UserProfileEditForm';
import UserSessions from './UserSessions';
import { UserTeams } from './UserTeams';
import { changeUserOrg, initUserProfilePage, revokeUserSession, updateUserProfile } from './state/actions';

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

const TAB_QUERY_PARAM = 'tab';
const GENERAL_SETTINGS_TAB = 'general';

type TabInfo = {
  id: string;
  title: string;
};

export interface OwnProps {}

function mapStateToProps(state: StoreState) {
  const userState = state.user;
  const { user, teams, orgs, sessions, teamsAreLoading, orgsAreLoading, sessionsAreLoading, isUpdating } = userState;
  return {
    orgsAreLoading,
    sessionsAreLoading,
    teamsAreLoading,
    orgs,
    sessions,
    teams,
    isUpdating,
    user,
  };
}

const mapDispatchToProps = {
  initUserProfilePage,
  revokeUserSession,
  changeUserOrg,
  updateUserProfile,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type Props = OwnProps & ConnectedProps<typeof connector>;

export function UserProfileEditPage({
  orgsAreLoading,
  sessionsAreLoading,
  teamsAreLoading,
  initUserProfilePage,
  orgs,
  sessions,
  teams,
  isUpdating,
  user,
  revokeUserSession,
  changeUserOrg,
  updateUserProfile,
}: Props) {
  const [queryParams, updateQueryParams] = useQueryParams();
  const tabQueryParam = queryParams[TAB_QUERY_PARAM];
  const [activeTab, setActiveTab] = useState<string>(
    typeof tabQueryParam === 'string' ? tabQueryParam : GENERAL_SETTINGS_TAB
  );

  useMount(() => initUserProfilePage());

  const { extensions } = usePluginComponentExtensions({ extensionPointId: PluginExtensionPoints.UserProfileTab });

  const groupedExtensionComponents = extensions.reduce<Record<string, PluginExtensionComponent[]>>((acc, extension) => {
    const { title } = extension;
    if (acc[title]) {
      acc[title].push(extension);
    } else {
      acc[title] = [extension];
    }
    return acc;
  }, {});

  const convertExtensionComponentTitleToTabId = (title: string) => title.toLowerCase();

  const showTabs = extensions.length > 0;
  const tabs: TabInfo[] = [
    {
      id: GENERAL_SETTINGS_TAB,
      title: t('user-profile.tabs.general', 'General'),
    },
    ...Object.keys(groupedExtensionComponents).map((title) => ({
      id: convertExtensionComponentTitleToTabId(title),
      title,
    })),
  ];

  const UserProfile = () => (
    <Stack direction="column" gap={2}>
      <UserProfileEditForm updateProfile={updateUserProfile} isSavingUser={isUpdating} user={user} />
      <SharedPreferences resourceUri="user" preferenceType="user" />
      <Stack direction="column" gap={6}>
        <UserVariables />
        <UserTeams isLoading={teamsAreLoading} teams={teams} />
        <UserOrganizations isLoading={orgsAreLoading} setUserOrg={changeUserOrg} orgs={orgs} user={user} />
        <UserSessions isLoading={sessionsAreLoading} revokeUserSession={revokeUserSession} sessions={sessions} />
      </Stack>
    </Stack>
  );

  const UserProfileWithTabs = () => (
    <div data-testid={selectors.components.UserProfile.extensionPointTabs}>
      <Stack direction="column" gap={2}>
        <TabsBar>
          {tabs.map(({ id, title }) => {
            return (
              <Tab
                key={id}
                label={title}
                active={activeTab === id}
                onChangeTab={() => {
                  setActiveTab(id);
                  updateQueryParams({ [TAB_QUERY_PARAM]: id });
                }}
                data-testid={selectors.components.UserProfile.extensionPointTab(id)}
              />
            );
          })}
        </TabsBar>
        <TabContent>
          {activeTab === GENERAL_SETTINGS_TAB && <UserProfile />}
          {Object.entries(groupedExtensionComponents).map(([title, pluginExtensionComponents]) => {
            const tabId = convertExtensionComponentTitleToTabId(title);

            if (activeTab === tabId) {
              return (
                <Fragment key={tabId}>
                  {pluginExtensionComponents.map(({ component: Component }, index) => (
                    <Component key={`${tabId}-${index}`} />
                  ))}
                </Fragment>
              );
            }
            return null;
          })}
        </TabContent>
      </Stack>
    </div>
  );

  return (
    <Page navId="profile/settings">
      <Page.Contents isLoading={!user}>{showTabs ? <UserProfileWithTabs /> : <UserProfile />}</Page.Contents>
    </Page>
  );
}

const UserVariables = () => {
  const variables: Variable[] = [
    { id: '1', uid: crypto.randomUUID(), name: 'foo', value: 'foo value', description: 'something about foo' },
    { id: '2', uid: crypto.randomUUID(), name: 'bar', value: 'bar value', description: 'something about bar' },
    { id: '3', uid: crypto.randomUUID(), name: 'baz', value: 'baz value', description: 'something about baz' },
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
        cell: ({ cell: { value } }: Cell<'scope'>) => <>{'user'}</>,
      },
      {
        id: 'scope_id',
        header: 'scope_id',
        cell: ({ cell: { value } }: Cell<'scope_id'>) => (
          <>{config.bootData.user.name + ' ' + `(id : ${config.bootData.user.id})`}</>
        ),
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
    []
  );
  return (
    <>
      <Stack direction={'column'} gap={0.5}>
        <Stack>
          <h3 className="page-sub-heading">Variables</h3>
          <Button variant="secondary" icon={'plus-square'} size="sm">
            Add new
          </Button>
        </Stack>
        <InteractiveTable columns={columns} data={variables} getRowId={(v) => v.uid}></InteractiveTable>
      </Stack>
    </>
  );
};

export default connector(UserProfileEditPage);
