import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, children, handleId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  // We can choose to provide the listeners either to the whole item 
  // or only to a specific "drag handle" child if we want.
  
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* 
          If you want a specific handle, children needs to be aware 
          of how to receive these listeners. 
          For simplicity, we'll pass listeners as a prop if children is a function,
          or we'll apply them to the whole container if handleId is not provided.
      */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { dragHandleProps: listeners });
        }
        return child;
      })}
    </div>
  );
}
