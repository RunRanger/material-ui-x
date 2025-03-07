import { createRenderer, fireEvent, screen, act } from '@mui/monorepo/test/utils';
import {
  getCell,
  getColumnHeaderCell,
  getColumnHeadersTextContent,
  getColumnValues,
} from 'test/utils/helperFn';
import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import {
  DataGridPro,
  DataGridProProps,
  GRID_TREE_DATA_GROUPING_FIELD,
  GridApiRef,
  GridLinkOperator,
  GridRowsProp,
  GridRowTreeNodeConfig,
  useGridApiRef,
} from '@mui/x-data-grid-pro';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

const rowsWithoutGap: GridRowsProp = [
  { name: 'A' },
  { name: 'A.A' },
  { name: 'A.B' },
  { name: 'B' },
  { name: 'B.A' },
  { name: 'B.B' },
  { name: 'B.B.A' },
  { name: 'B.B.A.A' },
  { name: 'C' },
];

const rowsWithGap: GridRowsProp = [
  { name: 'A' },
  { name: 'A.B' },
  { name: 'A.A' },
  { name: 'B.A' },
  { name: 'B.B' },
];

const baselineProps: DataGridProProps = {
  autoHeight: isJSDOM,
  rows: rowsWithoutGap,
  columns: [
    {
      field: 'name',
      width: 200,
    },
  ],
  treeData: true,
  getTreeDataPath: (row) => row.name.split('.'),
  getRowId: (row) => row.name,
};

describe('<DataGridPro /> - Tree Data', () => {
  const { render, clock } = createRenderer({ clock: 'fake' });

  let apiRef: GridApiRef;

  const Test = (props: Partial<DataGridProProps>) => {
    apiRef = useGridApiRef();

    return (
      <div style={{ width: 300, height: 800 }}>
        <DataGridPro {...baselineProps} apiRef={apiRef} {...props} disableVirtualization />
      </div>
    );
  };

  describe('prop: treeData', () => {
    it('should support tree data toggling', () => {
      const { setProps } = render(<Test treeData={false} />);
      expect(getColumnHeadersTextContent()).to.deep.equal(['name']);
      expect(getColumnValues(0)).to.deep.equal([
        'A',
        'A.A',
        'A.B',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'C',
      ]);
      setProps({ treeData: true });
      expect(getColumnHeadersTextContent()).to.deep.equal(['Group', 'name']);
      expect(getColumnValues(1)).to.deep.equal(['A', 'B', 'C']);
      setProps({ treeData: false });
      expect(getColumnHeadersTextContent()).to.deep.equal(['name']);
      expect(getColumnValues(0)).to.deep.equal([
        'A',
        'A.A',
        'A.B',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'C',
      ]);
    });

    it('should support enabling treeData after apiRef.current.updateRows has modified the rows', () => {
      const { setProps } = render(<Test treeData={false} defaultGroupingExpansionDepth={-1} />);
      expect(getColumnHeadersTextContent()).to.deep.equal(['name']);
      expect(getColumnValues(0)).to.deep.equal([
        'A',
        'A.A',
        'A.B',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'C',
      ]);
      apiRef.current.updateRows([{ name: 'A.A', _action: 'delete' }]);
      expect(getColumnValues(0)).to.deep.equal([
        'A',
        'A.B',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'C',
      ]);
      setProps({ treeData: true });
      expect(getColumnHeadersTextContent()).to.deep.equal(['Group', 'name']);
      expect(getColumnValues(1)).to.deep.equal([
        'A',
        'A.B',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'C',
      ]);
    });

    it('should support new dataset', () => {
      const { setProps } = render(<Test />);
      setProps({
        rows: [
          { nameBis: '1' },
          { nameBis: '1.1' },
          { nameBis: '1.2' },
          { nameBis: '2' },
          { nameBis: '2.1' },
        ],
        columns: [
          {
            field: 'nameBis',
            width: 200,
          },
        ],
        getTreeDataPath: (row) => row.nameBis.split('.'),
        getRowId: (row) => row.nameBis,
      });
      expect(getColumnHeadersTextContent()).to.deep.equal(['Group', 'nameBis']);
      expect(getColumnValues(1)).to.deep.equal(['1', '2']);
    });

    it('should keep children expansion when changing some of the rows', () => {
      const { setProps } = render(
        <Test disableVirtualization rows={[{ name: 'A' }, { name: 'A.A' }]} />,
      );
      expect(getColumnValues(1)).to.deep.equal(['A']);
      apiRef.current.setRowChildrenExpansion('A', true);
      clock.runToLast();
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A']);
      setProps({
        rows: [{ name: 'A' }, { name: 'A.A' }, { name: 'B' }, { name: 'B.A' }],
      });
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A', 'B']);
    });
  });

  describe('prop: getTreeDataPath', () => {
    it('should allow to transform path', () => {
      render(
        <Test
          getTreeDataPath={(row) => [...row.name.split('.').reverse()]}
          defaultGroupingExpansionDepth={-1}
        />,
      );
      expect(getColumnValues(1)).to.deep.equal([
        'A',
        'A.A',
        '',
        'B.B.A.A',
        'B.A',
        'B.B.A',
        'B',
        'A.B',
        'B.B',
        'C',
      ]);
    });

    it('should support new getTreeDataPath', () => {
      const { setProps } = render(<Test defaultGroupingExpansionDepth={-1} />);
      expect(getColumnValues(1)).to.deep.equal([
        'A',
        'A.A',
        'A.B',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'C',
      ]);
      setProps({ getTreeDataPath: (row) => [...row.name.split('.').reverse()] });
      expect(getColumnValues(1)).to.deep.equal([
        'A',
        'A.A',
        '',
        'B.B.A.A',
        'B.A',
        'B.B.A',
        'B',
        'A.B',
        'B.B',
        'C',
      ]);
    });
  });

  describe('prop: defaultGroupingExpansionDepth', () => {
    it('should not expand any row if defaultGroupingExpansionDepth = 0', () => {
      render(<Test defaultGroupingExpansionDepth={0} />);
      expect(getColumnValues(1)).to.deep.equal(['A', 'B', 'C']);
    });

    it('should expand all top level rows if defaultGroupingExpansionDepth = 1', () => {
      render(<Test defaultGroupingExpansionDepth={1} />);
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A', 'A.B', 'B', 'B.A', 'B.B', 'C']);
    });

    it('should expand all rows up to depth of 2 if defaultGroupingExpansionDepth = 2', () => {
      render(<Test defaultGroupingExpansionDepth={2} />);
      expect(getColumnValues(1)).to.deep.equal([
        'A',
        'A.A',
        'A.B',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'C',
      ]);
    });

    it('should expand all rows if defaultGroupingExpansionDepth = -1', () => {
      render(<Test defaultGroupingExpansionDepth={2} />);
      expect(getColumnValues(1)).to.deep.equal([
        'A',
        'A.A',
        'A.B',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'C',
      ]);
    });

    it('should not re-apply default expansion on rerender after expansion manually toggled', () => {
      const { setProps } = render(<Test />);
      expect(getColumnValues(1)).to.deep.equal(['A', 'B', 'C']);
      act(() => {
        apiRef.current.setRowChildrenExpansion('B', true);
      });
      expect(getColumnValues(1)).to.deep.equal(['A', 'B', 'B.A', 'B.B', 'C']);
      setProps({ sortModel: [{ field: 'name', sort: 'desc' }] });
      expect(getColumnValues(1)).to.deep.equal(['C', 'B', 'B.B', 'B.A', 'A']);
    });
  });

  describe('prop: isGroupExpandedByDefault', () => {
    it('should expand groups according to isGroupExpandedByDefault when defined', () => {
      const isGroupExpandedByDefault = spy((node: GridRowTreeNodeConfig) => node.id === 'A');

      render(<Test isGroupExpandedByDefault={isGroupExpandedByDefault} />);
      expect(isGroupExpandedByDefault.callCount).to.equal(8); // Should not be called on leaves
      const { childrenExpanded, ...node } = apiRef.current.state.rows.tree.A;
      const callForNodeA = isGroupExpandedByDefault
        .getCalls()
        .find((call) => call.firstArg.id === node.id)!;
      expect(callForNodeA.firstArg).to.deep.includes(node);
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A', 'A.B', 'B', 'C']);
    });

    it('should have priority over defaultGroupingExpansionDepth when both defined', () => {
      const isGroupExpandedByDefault = (node: GridRowTreeNodeConfig) => node.id === 'A';

      render(
        <Test
          isGroupExpandedByDefault={isGroupExpandedByDefault}
          defaultGroupingExpansionDepth={-1}
        />,
      );
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A', 'A.B', 'B', 'C']);
    });
  });

  describe('prop: groupingColDef', () => {
    it('should set the custom headerName', () => {
      render(<Test groupingColDef={{ headerName: 'Custom header name' }} />);
      expect(getColumnHeadersTextContent()).to.deep.equal(['Custom header name', 'name']);
    });

    it('should render descendant count when hideDescendantCount = false', () => {
      render(
        <Test groupingColDef={{ hideDescendantCount: false }} defaultGroupingExpansionDepth={-1} />,
      );
      expect(getColumnValues(0)).to.deep.equal([
        'A (2)',
        'A',
        'B',
        'B (4)',
        'A',
        'B (2)',
        'A (1)',
        'A',
        'C',
      ]);
    });

    it('should not render descendant count when hideDescendantCount = true', () => {
      render(
        <Test groupingColDef={{ hideDescendantCount: true }} defaultGroupingExpansionDepth={-1} />,
      );
      expect(getColumnValues(0)).to.deep.equal(['A', 'A', 'B', 'B', 'A', 'B', 'A', 'A', 'C']);
    });
  });

  describe('row grouping column', () => {
    it('should add a grouping column', () => {
      render(<Test />);
      const columnsHeader = getColumnHeadersTextContent();
      expect(columnsHeader).to.deep.equal(['Group', 'name']);
    });

    it('should render a toggling icon only when a row has children', () => {
      render(
        <Test
          rows={[{ name: 'A' }, { name: 'A.C' }, { name: 'B' }, { name: 'B.A' }]}
          filterModel={{
            linkOperator: GridLinkOperator.Or,
            items: [
              { columnField: 'name', operatorValue: 'endsWith', value: 'A', id: 0 },
              { columnField: 'name', operatorValue: 'endsWith', value: 'B', id: 1 },
            ],
          }}
        />,
      );
      expect(getColumnValues(1)).to.deep.equal(['A', 'B']);
      // No children after filtering
      expect(getCell(0, 0).querySelectorAll('button')).to.have.length(0);
      // Some children after filtering
      expect(getCell(1, 0).querySelectorAll('button')).to.have.length(1);
    });

    it('should toggle expansion when clicking on grouping column icon', () => {
      render(<Test />);
      expect(getColumnValues(1)).to.deep.equal(['A', 'B', 'C']);
      fireEvent.click(getCell(0, 0).querySelector('button'));
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A', 'A.B', 'B', 'C']);
      fireEvent.click(getCell(0, 0).querySelector('button'));
      expect(getColumnValues(1)).to.deep.equal(['A', 'B', 'C']);
    });

    it('should toggle expansion when pressing Space while focusing grouping column', () => {
      render(<Test />);
      expect(getColumnValues(1)).to.deep.equal(['A', 'B', 'C']);
      fireEvent.mouseUp(getCell(0, 0));
      fireEvent.click(getCell(0, 0));
      expect(getColumnValues(1)).to.deep.equal(['A', 'B', 'C']);
      fireEvent.keyDown(getCell(0, 0), { key: ' ' });
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A', 'A.B', 'B', 'C']);
      fireEvent.keyDown(getCell(0, 0), { key: ' ' });
      expect(getColumnValues(1)).to.deep.equal(['A', 'B', 'C']);
    });

    it('should add auto generated rows if some parents do not exist', () => {
      render(<Test rows={rowsWithGap} defaultGroupingExpansionDepth={-1} />);
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.B', 'A.A', '', 'B.A', 'B.B']);
    });

    it('should keep the grouping column width between generations', () => {
      render(<Test groupingColDef={{ width: 200 }} />);
      expect(getColumnHeaderCell(0)).toHaveInlineStyle({ width: '200px' });
      apiRef.current.updateColumns([{ field: GRID_TREE_DATA_GROUPING_FIELD, width: 100 }]);
      expect(getColumnHeaderCell(0)).toHaveInlineStyle({ width: '100px' });
      apiRef.current.updateColumns([
        {
          field: 'name',
          headerName: 'New name',
        },
      ]);
      expect(getColumnHeaderCell(0)).toHaveInlineStyle({ width: '100px' });
    });
  });

  describe('pagination', () => {
    it('should respect the pageSize for the top level rows when toggling children expansion', () => {
      render(<Test pagination pageSize={2} rowsPerPageOptions={[2]} />);
      expect(getColumnValues(1)).to.deep.equal(['A', 'B']);
      fireEvent.click(getCell(0, 0).querySelector('button'));
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A', 'A.B', 'B']);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(getColumnValues(1)).to.deep.equal(['C']);
    });

    it('should keep the row expansion when switching page', () => {
      render(<Test pagination pageSize={1} rowsPerPageOptions={[1]} />);
      expect(getColumnValues(1)).to.deep.equal(['A']);
      fireEvent.click(getCell(0, 0).querySelector('button'));
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A', 'A.B']);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(getColumnValues(1)).to.deep.equal(['B']);
      fireEvent.click(getCell(3, 0).querySelector('button'));
      expect(getColumnValues(1)).to.deep.equal(['B', 'B.A', 'B.B']);
      fireEvent.click(screen.getByRole('button', { name: /previous page/i }));
      expect(getColumnValues(1)).to.deep.equal(['A', 'A.A', 'A.B']);
      fireEvent.click(getCell(0, 0).querySelector('button'));
      expect(getColumnValues(1)).to.deep.equal(['A']);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(getColumnValues(1)).to.deep.equal(['B', 'B.A', 'B.B']);
    });
  });

  describe('filter', () => {
    it('should not show a node if none of its children match the filters and it does not match the filters', () => {
      render(
        <Test
          rows={[{ name: 'B' }, { name: 'B.B' }]}
          filterModel={{ items: [{ columnField: 'name', value: 'A', operatorValue: 'endsWith' }] }}
          defaultGroupingExpansionDepth={-1}
        />,
      );

      expect(getColumnValues(1)).to.deep.equal([]);
    });

    it('should show a node if some of its children match the filters even if it does not match the filters', () => {
      render(
        <Test
          rows={[{ name: 'B' }, { name: 'B.A' }, { name: 'B.B' }]}
          filterModel={{ items: [{ columnField: 'name', value: 'A', operatorValue: 'endsWith' }] }}
          defaultGroupingExpansionDepth={-1}
        />,
      );

      expect(getColumnValues(1)).to.deep.equal(['B', 'B.A']);
    });

    it('should show a node if none of its children match the filters but it does match the filters', () => {
      render(
        <Test
          rows={[{ name: 'A' }, { name: 'A.B' }]}
          filterModel={{ items: [{ columnField: 'name', value: 'A', operatorValue: 'endsWith' }] }}
          defaultGroupingExpansionDepth={-1}
        />,
      );

      expect(getColumnValues(1)).to.deep.equal(['A']);
    });

    it('should not filter the children if props.disableChildrenFiltering = true', () => {
      render(
        <Test
          rows={[{ name: 'B' }, { name: 'B.A' }, { name: 'B.B' }]}
          filterModel={{ items: [{ columnField: 'name', value: 'B', operatorValue: 'endsWith' }] }}
          disableChildrenFiltering
          defaultGroupingExpansionDepth={-1}
        />,
      );

      expect(getColumnValues(1)).to.deep.equal(['B', 'B.A', 'B.B']);
    });

    it('should allow to toggle props.disableChildrenFiltering', () => {
      const { setProps } = render(
        <Test
          rows={[{ name: 'B' }, { name: 'B.A' }, { name: 'B.B' }]}
          filterModel={{ items: [{ columnField: 'name', value: 'B', operatorValue: 'endsWith' }] }}
          defaultGroupingExpansionDepth={-1}
        />,
      );
      expect(getColumnValues(1)).to.deep.equal(['B', 'B.B']);

      setProps({ disableChildrenFiltering: true });
      expect(getColumnValues(1)).to.deep.equal(['B', 'B.A', 'B.B']);

      setProps({ disableChildrenFiltering: false });
      expect(getColumnValues(1)).to.deep.equal(['B', 'B.B']);
    });

    it('should throw an error when using filterMode="server" and treeData', () => {
      expect(() => {
        render(<Test filterMode="server" />);
      }).toErrorDev(
        'MUI: The `filterMode="server"` prop is not available when the `treeData` is enabled.',
      );
    });

    it('should set the filtered descendant count on matching nodes even if the children are collapsed', () => {
      render(
        <Test
          filterModel={{ items: [{ columnField: 'name', value: 'A', operatorValue: 'endsWith' }] }}
        />,
      );

      // A has A.A but not A.B
      // B has B.A (match filter), B.B (has matching children), B.B.A (match filters), B.B.A.A (match filters)
      expect(getColumnValues(0)).to.deep.equal(['A (1)', 'B (4)']);
    });
  });

  describe('sorting', () => {
    it('should respect the prop order for a given depth when no sortModel provided', () => {
      render(
        <Test
          rows={[{ name: 'D' }, { name: 'A.B' }, { name: 'A' }, { name: 'A.A' }]}
          defaultGroupingExpansionDepth={-1}
        />,
      );
      expect(getColumnValues(1)).to.deep.equal(['D', 'A', 'A.B', 'A.A']);
    });

    it('should apply the sortModel on every depth of the tree if props.disableChildrenSorting = false', () => {
      render(
        <Test sortModel={[{ field: 'name', sort: 'desc' }]} defaultGroupingExpansionDepth={-1} />,
      );
      expect(getColumnValues(1)).to.deep.equal([
        'C',
        'B',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'B.A',
        'A',
        'A.B',
        'A.A',
      ]);
    });

    it('should only apply the sortModel on top level rows if props.disableChildrenSorting = true', () => {
      render(
        <Test
          sortModel={[{ field: 'name', sort: 'desc' }]}
          disableChildrenSorting
          defaultGroupingExpansionDepth={-1}
        />,
      );
      expect(getColumnValues(1)).to.deep.equal([
        'C',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'A',
        'A.A',
        'A.B',
      ]);
    });

    it('should allow to toggle props.disableChildrenSorting', () => {
      const { setProps } = render(
        <Test sortModel={[{ field: 'name', sort: 'desc' }]} defaultGroupingExpansionDepth={-1} />,
      );
      expect(getColumnValues(1)).to.deep.equal([
        'C',
        'B',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'B.A',
        'A',
        'A.B',
        'A.A',
      ]);

      setProps({ disableChildrenSorting: true });
      expect(getColumnValues(1)).to.deep.equal([
        'C',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'A',
        'A.A',
        'A.B',
      ]);

      setProps({ disableChildrenSorting: false });
      expect(getColumnValues(1)).to.deep.equal([
        'C',
        'B',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'B.A',
        'A',
        'A.B',
        'A.A',
      ]);
    });

    it('should update the order server side', () => {
      const { setProps } = render(<Test sortingMode="server" defaultGroupingExpansionDepth={-1} />);
      expect(getColumnValues(1)).to.deep.equal([
        'A',
        'A.A',
        'A.B',
        'B',
        'B.A',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'C',
      ]);
      setProps({
        rows: [
          { name: 'C' },
          { name: 'B' },
          { name: 'B.B' },
          { name: 'B.B.A' },
          { name: 'B.B.A.A' },
          { name: 'B.A' },
          { name: 'A' },
          { name: 'A.B' },
          { name: 'A.A' },
        ],
      });
      expect(getColumnValues(1)).to.deep.equal([
        'C',
        'B',
        'B.B',
        'B.B.A',
        'B.B.A.A',
        'B.A',
        'A',
        'A.B',
        'A.A',
      ]);
    });
  });
});
