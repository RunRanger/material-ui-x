import * as React from 'react';
import PropTypes from 'prop-types';
import { unstable_composeClasses as composeClasses } from '@mui/material';
import { unstable_useEnhancedEffect as useEnhancedEffect, debounce } from '@mui/material/utils';
import { styled } from '@mui/material/styles';
import InputBase, { InputBaseProps } from '@mui/material/InputBase';
import { GridRenderEditCellParams } from '../../models/params/gridCellParams';
import { getDataGridUtilityClass } from '../../gridClasses';
import { useGridRootProps } from '../../hooks/utils/useGridRootProps';
import { DataGridProcessedProps } from '../../models/props/DataGridProps';
import { SUBMIT_FILTER_STROKE_TIME } from '../panel/filterPanel/GridFilterInputValue';

type OwnerState = { classes: DataGridProcessedProps['classes'] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ['editInputCell'],
  };

  return composeClasses(slots, getDataGridUtilityClass, classes);
};

const GridEditInputCellRoot = styled(InputBase, {
  name: 'MuiDataGrid',
  slot: 'EditInputCell',
  overridesResolver: (props, styles) => styles.editInputCell,
})(({ theme }) => ({
  ...theme.typography.body2,
  padding: '1px 0',
  '& input': {
    padding: '0 16px',
    height: '100%',
  },
}));

function GridEditInputCell(props: GridRenderEditCellParams & Omit<InputBaseProps, 'id'>) {
  const {
    id,
    value,
    formattedValue,
    api,
    field,
    row,
    rowNode,
    colDef,
    cellMode,
    isEditable,
    tabIndex,
    hasFocus,
    getValue,
    isValidating,
    ...other
  } = props;

  const inputRef = React.useRef<HTMLInputElement>();
  const [valueState, setValueState] = React.useState(value);
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  const debouncedSetEditCellValue = React.useMemo(
    () => debounce(api.setEditCellValue, SUBMIT_FILTER_STROKE_TIME),
    [api.setEditCellValue],
  );

  const handleChange = React.useCallback(
    (event) => {
      const newValue = event.target.value;
      setValueState(newValue);
      debouncedSetEditCellValue({ id, field, value: newValue }, event);
    },
    [debouncedSetEditCellValue, field, id],
  );

  React.useEffect(() => {
    setValueState(value);
  }, [value]);

  useEnhancedEffect(() => {
    if (hasFocus) {
      inputRef.current!.focus();
    }
  }, [hasFocus]);

  return (
    <GridEditInputCellRoot
      inputRef={inputRef}
      className={classes.root}
      fullWidth
      type={colDef.type === 'number' ? colDef.type : 'text'}
      value={valueState ?? ''}
      onChange={handleChange}
      {...other}
    />
  );
}

GridEditInputCell.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * GridApi that let you manipulate the grid.
   */
  api: PropTypes.object.isRequired,
  isValidating: PropTypes.bool,
} as any;

export { GridEditInputCell };
export const renderEditInputCell = (params) => <GridEditInputCell {...params} />;
