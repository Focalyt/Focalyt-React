import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import {
  B2COption,
  fetchB2CBatches,
  fetchB2CFilterOptions,
} from '../../services/b2cApi';
import { college } from '../../theme/college';
import { B2BFilterSelect } from '../b2b/B2BFilterSelect';

export type B2CCycleFiltersState = {
  department: string;
  project: string;
  center: string;
  course: string;
  batch: string;
};

export const EMPTY_B2C_CYCLE_FILTERS: B2CCycleFiltersState = {
  department: '',
  project: '',
  center: '',
  course: '',
  batch: '',
};

type Props = {
  token: string;
  value: B2CCycleFiltersState;
  onChange: (next: B2CCycleFiltersState) => void;
};

function toOptions(items: B2COption[]) {
  return items.map(i => ({
    value: i._id,
    label: i.name || '—',
  }));
}

export function B2CCycleFilters({ token, value, onChange }: Props) {
  const [verticals, setVerticals] = React.useState<B2COption[]>([]);
  const [projects, setProjects] = React.useState<B2COption[]>([]);
  const [courses, setCourses] = React.useState<B2COption[]>([]);
  const [centers, setCenters] = React.useState<B2COption[]>([]);
  const [batches, setBatches] = React.useState<B2COption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchB2CFilterOptions(token);
        if (cancelled || !res.ok) return;
        setVerticals(res.verticals);
        setProjects(res.projects);
        setCourses(res.courses);
        setCenters(res.centers);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const res = await fetchB2CBatches(token, value.center, value.course);
      if (cancelled) return;
      if (res.ok) setBatches(res.items);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, value.center, value.course]);

  const setDept = (department: string) => {
    onChange({
      department,
      project: '',
      center: '',
      course: '',
      batch: '',
    });
  };

  const setProject = (project: string) => {
    onChange({
      ...value,
      project,
      center: '',
      course: '',
      batch: '',
    });
  };

  const setCenter = (center: string) => {
    onChange({ ...value, center, batch: '' });
  };

  const setCourse = (course: string) => {
    onChange({ ...value, course, batch: '' });
  };

  if (loading && !verticals.length) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#fc567b" size="small" />
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
        value={value.department}
        options={toOptions(verticals)}
        onChange={setDept}
      />
      <B2BFilterSelect
        label="Project"
        value={value.project}
        options={toOptions(projects)}
        onChange={setProject}
      />
      <B2BFilterSelect
        label="Center"
        value={value.center}
        options={toOptions(centers)}
        onChange={setCenter}
      />
      <B2BFilterSelect
        label="Course"
        value={value.course}
        options={toOptions(courses)}
        onChange={setCourse}
      />
      <B2BFilterSelect
        label="Batch"
        value={value.batch}
        options={toOptions(batches)}
        onChange={batch => onChange({ ...value, batch })}
        disabled={!value.center && !value.course}
        placeholder="All"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'flex-start',
  },
  loading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
