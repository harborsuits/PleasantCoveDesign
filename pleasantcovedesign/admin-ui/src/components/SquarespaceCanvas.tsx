import React, { useState, useRef, useEffect } from 'react';
import { 
  Image, 
  FileText, 
  MessageCircle, 
  Plus,
  Move,
  Trash2,
  Check,
  X,
  Send
} from 'lucide-react';
import api from '../api';

interface CanvasElement {
  id: string;
  type: 'image' | 'text' | 'document';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  elementId: string;
  x: number; // Position relative to element
  y: number;
  author: {
    name: string;
    avatar: string;
    squarespaceId?: string;
  };
  content: string;
  timestamp: string;
  replies?: Comment[];
}

interface SquarespaceCanvasProps {
  projectToken: string;
  squarespaceAccountId?: string;
  currentUser: {
    name: string;
    avatar: string;
    role: 'admin' | 'client';
  };
}

const SquarespaceCanvas: React.FC<SquarespaceCanvasProps> = ({ 
  projectToken, 
  squarespaceAccountId,
  currentUser 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(true);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentPosition, setCommentPosition] = useState<{ elementId: string; x: number; y: number } | null>(null);
  
  // Tool states
  const [activeTool, setActiveTool] = useState<'select' | 'image' | 'text' | 'document' | 'comment'>('select');
  
  // Drag offset
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load canvas state
  useEffect(() => {
    fetchCanvasData();
  }, [projectToken, squarespaceAccountId]);

  const fetchCanvasData = async () => {
    try {
      const response = await api.get(`/canvas/${projectToken}`, {
        params: { squarespaceAccountId }
      });
      
      if (response.data.elements) {
        setElements(response.data.elements);
      }
    } catch (error) {
      console.error('Failed to fetch canvas data:', error);
    }
  };

  const saveCanvasState = async () => {
    try {
      await api.post(`/canvas/${projectToken}/save`, {
        elements,
        squarespaceAccountId
      });
    } catch (error) {
      console.error('Failed to save canvas:', error);
    }
  };

  // Auto-save on changes
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (elements.length > 0) {
        saveCanvasState();
      }
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [elements]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'comment' && selectedElement) {
      // Add comment pin to selected element
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        const relativeX = x - element.x;
        const relativeY = y - element.y;
        setCommentPosition({ elementId: selectedElement, x: relativeX, y: relativeY });
      }
      return;
    }

    // Add new element
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type: activeTool as 'image' | 'text' | 'document',
      x,
      y,
      width: activeTool === 'text' ? 200 : 150,
      height: activeTool === 'text' ? 100 : 150,
      content: activeTool === 'text' ? 'Add text here...' : '',
      comments: []
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setActiveTool('select');
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    
    if (activeTool === 'comment') {
      return; // Let canvas click handle comment placement
    }

    setSelectedElement(elementId);
    setDragging(elementId);

    const element = elements.find(el => el.id === elementId);
    if (element && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setElements(elements.map(el => 
      el.id === dragging ? { ...el, x, y } : el
    ));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const deleteElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !commentPosition) return;

    const element = elements.find(el => el.id === commentPosition.elementId);
    if (!element) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      elementId: commentPosition.elementId,
      x: commentPosition.x,
      y: commentPosition.y,
      author: currentUser,
      content: newComment,
      timestamp: new Date().toISOString()
    };

    // Update element with new comment
    setElements(elements.map(el => 
      el.id === commentPosition.elementId 
        ? { ...el, comments: [...el.comments, comment] }
        : el
    ));

    // Send to backend
    try {
      await api.post(`/canvas/${projectToken}/comment`, {
        elementId: commentPosition.elementId,
        comment,
        squarespaceAccountId
      });
    } catch (error) {
      console.error('Failed to save comment:', error);
    }

    setNewComment('');
    setCommentPosition(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get all comments sorted by timestamp
  const allComments = elements
    .flatMap(el => el.comments.map(c => ({ ...c, elementType: el.type })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="w-16 bg-white border-r border-gray-200 p-2">
        <div className="space-y-2">
          <button
            onClick={() => setActiveTool('select')}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Select"
          >
            <Move className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setActiveTool('image')}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTool === 'image' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Add Image"
          >
            <Image className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setActiveTool('text')}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Add Text"
          >
            <FileText className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setActiveTool('document')}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTool === 'document' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Add Document"
          >
            <FileText className="w-5 h-5" />
          </button>
          
          <div className="h-px bg-gray-200 my-2" />
          
          <button
            onClick={() => setActiveTool('comment')}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTool === 'comment' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Add Comment"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Design Canvas</h2>
              <p className="text-sm text-gray-500">
                {squarespaceAccountId ? `Squarespace Account: ${squarespaceAccountId}` : 'Project Canvas'}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Admin adds components here — users can comment & rearrange
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={canvasRef}
            className="relative w-full h-full bg-white border-2 border-dashed border-gray-300 m-4 rounded-lg"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ cursor: activeTool === 'comment' ? 'crosshair' : 'default' }}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className={`absolute border-2 rounded-lg p-4 cursor-move ${
                  selectedElement === element.id 
                    ? 'border-blue-500 shadow-lg' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element.id)}
              >
                {/* Element Content */}
                {element.type === 'image' && (
                  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {element.type === 'text' && (
                  <div className="w-full h-full">
                    <textarea
                      className="w-full h-full resize-none border-0 outline-none"
                      defaultValue={element.content}
                      onChange={(e) => {
                        setElements(elements.map(el => 
                          el.id === element.id 
                            ? { ...el, content: e.target.value }
                            : el
                        ));
                      }}
                    />
                  </div>
                )}
                
                {element.type === 'document' && (
                  <div className="w-full h-full bg-gray-50 rounded p-2">
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 rounded w-full" />
                      <div className="h-2 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                )}

                {/* Comment Pins */}
                {element.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="absolute w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs cursor-pointer hover:bg-blue-600"
                    style={{
                      left: comment.x - 12,
                      top: comment.y - 12
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveComment(comment.id);
                    }}
                  >
                    <MessageCircle className="w-3 h-3" />
                  </div>
                ))}

                {/* Delete Button */}
                {selectedElement === element.id && (
                  <button
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(element.id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {/* Comment Placement Indicator */}
            {commentPosition && (
              <div
                className="absolute w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs animate-pulse"
                style={{
                  left: elements.find(el => el.id === commentPosition.elementId)!.x + commentPosition.x - 12,
                  top: elements.find(el => el.id === commentPosition.elementId)!.y + commentPosition.y - 12
                }}
              >
                <Plus className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Sidebar */}
      {showComments && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {allComments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No comments yet</p>
                <p className="text-sm mt-2">
                  Select an element and click the comment tool to add feedback
                </p>
              </div>
            ) : (
              allComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg ${
                    activeComment === comment.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.name}`}
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{comment.author.name}</span>
                        <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                      {comment.author.squarespaceId && (
                        <p className="text-xs text-gray-400 mt-1">
                          Squarespace ID: {comment.author.squarespaceId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          {commentPosition && (
            <div className="p-4 border-t">
              <div className="flex items-start gap-3">
                <img
                  src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-2 border rounded-lg resize-none text-sm"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setCommentPosition(null);
                        setNewComment('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SquarespaceCanvas;
