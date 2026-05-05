import { baseStyles } from './styleFragments/base';
import { layoutStyles } from './styleFragments/layout';
import { cardStyles } from './styleFragments/cards';
import { chartStyles } from './styleFragments/charts';
import { tableStyles } from './styleFragments/tables';
import { componentStyles } from './styleFragments/components';
import { responsiveStyles } from './styleFragments/responsive';

export const getStyles = (): string => {
	return `
		${baseStyles}
		${layoutStyles}
		${cardStyles}
		${chartStyles}
		${tableStyles}
		${componentStyles}
		${responsiveStyles}
	`;
};
