import { createSelector } from '../../../utils/createSelector';
import { GridState } from '../../../models/gridState';

export const gridRowsStateSelector = (state: GridState) => state.rows;

export const gridRowCountSelector = createSelector(
  gridRowsStateSelector,
  (rows) => rows.totalRowCount,
);

export const gridTopLevelRowCountSelector = createSelector(
  gridRowsStateSelector,
  (rows) => rows.totalTopLevelRowCount,
);

export const gridRowsLookupSelector = createSelector(
  gridRowsStateSelector,
  (rows) => rows.idRowsLookup,
);

export const gridRowTreeSelector = createSelector(gridRowsStateSelector, (rows) => rows.tree);

export const gridRowGroupingNameSelector = createSelector(
  gridRowsStateSelector,
  (rows) => rows.groupingName,
);

export const gridRowTreeDepthSelector = createSelector(
  gridRowsStateSelector,
  (rows) => rows.treeDepth,
);

export const gridRowIdsSelector = createSelector(gridRowsStateSelector, (rows) => rows.ids);
