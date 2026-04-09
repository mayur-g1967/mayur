import ModuleProgresRow from './ModuleProgressRow.jsx'
import { FileXCorner } from 'lucide-react';

export default function ModuleProgressList({ modules, selectedCategory, statusFilter, sortOption }) {

    const filteredModules = selectedCategory === 'all' ? modules : modules.filter(module => module.id === selectedCategory);

    let submodulerows = filteredModules.flatMap(module =>
        module.submodules.map(submodule => ({
            parentModule: module,
            submodule: submodule
        }))
    );

    if (statusFilter && statusFilter !== 'all') {
        submodulerows = submodulerows.filter(({ submodule }) => {
            // Virtual rows (Continue / Review) always show regardless of filter
            if (submodule.isVirtual) return true;
            const progress = submodule.progress;
            if (statusFilter === 'completed') return progress === 100;
            if (statusFilter === 'inprogress') return progress > 0 && progress < 100;
            if (statusFilter === 'pending') return progress === 0;
            return true;
        })
    }

    if (sortOption === 'progress-desc') {
        submodulerows.sort((a, b) => b.submodule.progress - a.submodule.progress);
    } else if (sortOption === 'progress-asc') {
        submodulerows.sort((a, b) => a.submodule.progress - b.submodule.progress);
    } else if (sortOption === 'az') {
        submodulerows.sort((a, b) => a.submodule.name.localeCompare(b.submodule.name));
    } else if (sortOption === 'za') {
        submodulerows.sort((a, b) => b.submodule.name.localeCompare(a.submodule.name));
    }

    const empty = () => {
        if (statusFilter !== 'all' && selectedCategory === 'all') {
            return `No ${statusFilter} modules found.`
        } else if (statusFilter !== 'all' && selectedCategory !== 'all') {
            return `No ${statusFilter} modules found in ${selectedCategory}.`
        } else {
            return 'No modules found.'
        }
    };

    return (
        <div className='flex flex-col gap-3'>
            {submodulerows.length === 0 ? (
                <div className='h-85 flex flex-col justify-center items-center gap-2'>
                    <div className='flex justify-center items-center gap-2'>
                        <FileXCorner /><p>{empty()}</p>
                    </div>
                    <p className='text-sm text-muted-foreground'>Try Adjusting the Filters</p>
                </div>
            ) : (
                submodulerows.map(({ parentModule, submodule }) => (
                    <ModuleProgresRow
                        key={`${parentModule.id}-${submodule.id}`}
                        parentModule={parentModule}
                        submodule={submodule}
                    />
                ))
            )}
        </div>
    )
}
