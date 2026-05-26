import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import {
  B2BOption,
  fetchB2BDepartments,
  fetchB2BProjects,
  fetchB2BTypes,
  fetchB2BUsers,
} from '../../services/b2bApi';
import { college } from '../../theme/college';
import { B2BFilterSelect } from './B2BFilterSelect';

export type B2BCycleFiltersState = {
  b2bDepartment: string;
  b2bProject: string;
  typeOfB2B: string;
  leadOwner: string;
};

export const EMPTY_CYCLE_FILTERS: B2BCycleFiltersState = {
  b2bDepartment: '',
  b2bProject: '',
  typeOfB2B: '',
  leadOwner: '',
};

type Props = {
  token: string;
  value: B2BCycleFiltersState;
  onChange: (next: B2BCycleFiltersState) => void;
};

function toOptions(items: B2BOption[]) {
  return items.map(i => ({
    value: i._id,
    label: i.name || '—',
  }));
}

export function B2BCycleFilters({ token, value, onChange }: Props) {
  const [departments, setDepartments] = React.useState<B2BOption[]>([]);
  const [projects, setProjects] = React.useState<B2BOption[]>([]);
  const [types, setTypes] = React.useState<B2BOption[]>([]);
  const [counsellors, setCounsellors] = React.useState<B2BOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [d, p, t, u] = await Promise.all([
          fetchB2BDepartments(token),
          fetchB2BProjects(token),
          fetchB2BTypes(token),
          fetchB2BUsers(token),
        ]);
        if (cancelled) return;
        if (d.ok) setDepartments(d.items);
        if (p.ok) setProjects(p.items);
        if (t.ok) setTypes(t.items);
        if (u.ok) setCounsellors(u.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  React.useEffect(() => {
    if (!token || !value.b2bDepartment) return;
    let cancelled = false;
    (async () => {
      const [p, t] = await Promise.all([
        fetchB2BProjects(token, value.b2bDepartment),
        fetchB2BTypes(token, value.b2bDepartment),
      ]);
      if (cancelled) return;
      if (p.ok) setProjects(p.items);
      if (t.ok) setTypes(t.items);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, value.b2bDepartment]);

  const projectOptions = React.useMemo(() => {
    if (!value.b2bDepartment) return toOptions(projects);
    return toOptions(
      projects.filter(
        p => !p.department || String(p.department) === String(value.b2bDepartment),
      ),
    );
  }, [projects, value.b2bDepartment]);

  const typeOptions = React.useMemo(() => {
    if (!value.b2bDepartment) return toOptions(types);
    return toOptions(
      types.filter(
        t => !t.department || String(t.department) === String(value.b2bDepartment),
      ),
    );
  }, [types, value.b2bDepartment]);

  const setDept = (b2bDepartment: string) => {
    onChange({
      ...value,
      b2bDepartment,
      b2bProject: '',
      typeOfB2B: '',
    });
  };

  const setProject = (b2bProject: string) => {
    onChange({ ...value, b2bProject, typeOfB2B: '' });
  };

  if (loading && !departments.length) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={college.primary} size="small" />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      <B2BFilterSelect
        label="Department"
        value={value.b2bDepartment}
        options={toOptions(departments)}
        onChange={setDept}
      />
      <B2BFilterSelect
        label="Project"
        value={value.b2bProject}
        options={projectOptions}
        onChange={setProject}
        disabled={!value.b2bDepartment}
        placeholder={value.b2bDepartment ? 'All' : 'Select dept'}
      />
      <B2BFilterSelect
        label="Type"
        value={value.typeOfB2B}
        options={typeOptions}
        onChange={typeOfB2B => onChange({ ...value, typeOfB2B })}
        disabled={!value.b2bDepartment}
        placeholder={value.b2bDepartment ? 'All' : 'Select dept'}
      />
      <B2BFilterSelect
        label="Counsellor"
        value={value.leadOwner}
        options={toOptions(counsellors)}
        onChange={leadOwner => onChange({ ...value, leadOwner })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  loading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
